(function () {
  function extractRows(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    if (result && Array.isArray(result.rows)) return result.rows;
    if (result && Array.isArray(result.items)) return result.items;
    if (result && Array.isArray(result.result)) return result.result;
    return [];
  }

  function getOrderStatus(order) {
    var row = order || {};
    if (row.ngayhuy) return "cancel";
    if (row.ngayhoanthanh) return "completed";
    if (row.ngaynhan) return "processing";
    if (row.thoigiandatdichvu) return "pending";
    return "pending";
  }

  function getOrderStatusLabel(status) {
    if (status === "processing") return "Đã nhận đơn";
    if (status === "completed") return "Đã hoàn thành";
    if (status === "cancel") return "Đã hủy";
    return "Chờ nhận đơn";
  }

  function getOrderStatusClass(status) {
    if (status === "processing") return "status-processing";
    if (status === "completed") return "status-completed";
    if (status === "cancel") return "status-cancel";
    return "status-pending";
  }

  function getPaymentStatusLabel(value) {
    return String(value || "")
      .trim()
      .toLowerCase() === "paid"
      ? "Đã thanh toán"
      : "Chưa thanh toán";
  }

  function formatOrderCode(orderId) {
    var id = Number(orderId);
    if (!Number.isFinite(id) || id <= 0) return "-";
    return String(Math.floor(id)).padStart(7, "0");
  }

  function normalizePhone(phone) {
    var value = String(phone || "")
      .replace(/\s+/g, "")
      .trim();
    if (value.indexOf("+84") === 0) return "0" + value.slice(3);
    if (value.indexOf("84") === 0 && value.length >= 11)
      return "0" + value.slice(2);
    return value;
  }

  function normalizeId(id) {
    return String(id == null ? "" : id).trim();
  }

  function mergeOrderWithCustomer(order, customer) {
    if (!customer || typeof customer !== "object") return order;
    return Object.assign({}, order, {
      khachhang: customer,
      hovaten: order.hovaten || customer.hovaten || customer.user_name || "",
      sodienthoai:
        order.sodienthoai || customer.sodienthoai || customer.user_tel || "",
      email: order.email || customer.email || customer.user_email || "",
      diachi: order.diachi || customer.diachi || "",
    });
  }

  function fetchOrdersByPhone(table, phone, limit) {
    var normalizedPhone = normalizePhone(phone);
    var queryLimit = Number(limit) > 0 ? Number(limit) : 200;

    var ordersPromise = Promise.resolve(
      window.krudList({
        table: table,
        where: [
          {
            conditions: [
              {
                field: "sodienthoai",
                operator: "=",
                value: normalizedPhone,
              },
            ],
          },
        ],
        page: 1,
        limit: queryLimit,
      }),
    ).then(extractRows);

    if (!normalizedPhone) return ordersPromise;

    var customerPromise = Promise.resolve(
      window.krudList({
        table: "khachhang",
        where: [
          { field: "sodienthoai", operator: "=", value: normalizedPhone },
        ],
        page: 1,
        limit: 1,
      }),
    )
      .then(extractRows)
      .then(function (rows) {
        return rows[0] || null;
      })
      .catch(function () {
        return null;
      });

    return Promise.all([ordersPromise, customerPromise]).then(
      function (result) {
        var orders = result[0] || [];
        var customer = result[1];
        if (!customer) return orders;
        return orders.map(function (order) {
          return mergeOrderWithCustomer(order, customer);
        });
      },
    );
  }

  function fetchAllOrders(table, limit, page) {
    if (typeof window.krudList !== "function") {
      return Promise.reject(new Error("KRUD chua san sang"));
    }

    var queryPage = Number(page) > 0 ? Number(page) : 1;
    var queryLimit = Number(limit) > 0 ? Number(limit) : 200;

    var ordersPromise = Promise.resolve(
      window.krudList({
        table: table,
        page: queryPage,
        limit: queryLimit,
      }),
    ).then(extractRows);

    var customersPromise = Promise.resolve(
      window.krudList({
        table: "khachhang",
        // page: 1,
        // limit: 100,
      }),
    )
      .then(extractRows)
      .catch(function () {
        return [];
      });

    return Promise.all([ordersPromise, customersPromise]).then(function (res) {
      var orders = res[0] || [];
      var customers = res[1] || [];
      if (!customers.length) return orders;

      var customerById = {};
      var customerByPhone = {};

      customers.forEach(function (customer) {
        var customerId = normalizeId(
          customer.id || customer.makhachhang || customer.user_id,
        );
        if (customerId && !customerById[customerId]) {
          customerById[customerId] = customer;
        }

        var customerPhone = normalizePhone(
          customer.sodienthoai || customer.user_tel || customer.phone,
        );
        if (customerPhone && !customerByPhone[customerPhone]) {
          customerByPhone[customerPhone] = customer;
        }
      });

      return orders.map(function (order) {
        var orderCustomerId = normalizeId(
          order.idkhachhang || order.makhachhang || order.user_id,
        );
        var orderPhone = normalizePhone(order.sodienthoai);

        var customer =
          (orderCustomerId && customerById[orderCustomerId]) ||
          (orderPhone && customerByPhone[orderPhone]) ||
          null;

        return customer ? mergeOrderWithCustomer(order, customer) : order;
      });
    });
  }

  function updateOrder(table, orderId, data) {
    var id = Number(orderId);
    if (!Number.isFinite(id) || id <= 0) {
      return Promise.reject(new Error("Ma don khong hop le"));
    }
    if (typeof window.krud !== "function") {
      return Promise.reject(new Error("KRUD chua san sang"));
    }

    return Promise.resolve(window.krud("update", table, data || {}, id)).then(
      function (result) {
        if (!result || result.success === false || result.error) {
          throw new Error(
            (result && (result.error || result.message)) ||
              "Cap nhat don that bai",
          );
        }
        return result;
      },
    );
  }

  function fetchOrderById(table, orderId) {
    var id = Number(orderId);
    if (!Number.isFinite(id) || id <= 0) {
      return Promise.reject(new Error("Ma don khong hop le"));
    }
    if (typeof window.krudList !== "function") {
      return Promise.reject(new Error("KRUD chua san sang"));
    }

    return Promise.resolve(
      window.krudList({
        table: table,
        where: [{ field: "id", operator: "=", value: id }],
        limit: 1,
      }),
    )
      .then(extractRows)
      .then(function (rows) {
        return rows && rows.length ? rows[0] : null;
      });
  }

  function acceptProviderOrder(orderId, table, extraData) {
    return updateOrder(
      table,
      orderId,
      Object.assign({ ngaynhan: new Date().toISOString() }, extraData || {}),
    );
  }

  function completeProviderOrder(orderId, table, extraData) {
    return updateOrder(
      table,
      orderId,
      Object.assign(
        {
          ngayhoanthanh: new Date().toISOString(),
          trangthaithanhtoan: "Paid",
        },
        extraData || {},
      ),
    );
  }

  window.SharedOrderUtils = {
    extractRows: extractRows,
    getOrderStatus: getOrderStatus,
    getOrderStatusLabel: getOrderStatusLabel,
    getOrderStatusClass: getOrderStatusClass,
    getPaymentStatusLabel: getPaymentStatusLabel,
    formatOrderCode: formatOrderCode,
    fetchOrderById: fetchOrderById,
    updateOrder: updateOrder,
    fetchAllOrders: fetchAllOrders,
    fetchOrdersByPhone: fetchOrdersByPhone,
    acceptProviderOrder: acceptProviderOrder,
    completeProviderOrder: completeProviderOrder,
  };
})();
