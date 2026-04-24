<?php
require_once __DIR__ . '/../includes/bootstrap.php';
moving_admin_require_login();

$pageTitle = 'Cấu hình upload | Admin Chuyển Dọn';
require_once __DIR__ . '/../includes/header_admin.php';
?>

<section class="hero-card">
    <div>
        <h1>Cấu hình upload</h1>
        <p>Quản lý dung lượng file tối đa cho các luồng upload của chuyển dọn mà không chạm vào Apps Script Google Drive hoặc Google Sheet.</p>
    </div>
</section>

<section class="panel" style="max-width: 760px;">
    <div class="section-header">
        <div>
            <h2>Giới hạn dung lượng</h2>
            <p>Frontend sẽ đọc cấu hình này trước khi upload ảnh hoặc video.</p>
        </div>
    </div>

    <form id="upload-settings-form">
        <div class="field" style="max-width: 320px;">
            <label for="max_upload_mb">Dung lượng file upload tối đa (MB)</label>
            <input
                type="number"
                id="max_upload_mb"
                name="max_upload_mb"
                class="input"
                min="1"
                step="1"
                value="25">
            <p class="muted" style="margin-top: 10px;">
                Áp dụng cho upload đặt lịch, đánh giá, báo cáo và avatar. Không sửa Apps Script Google Drive / Google Sheet.
            </p>
        </div>

        <div id="upload-settings-status" class="muted" style="display:none; margin: 18px 0 0; padding: 14px 16px; border-radius: 16px;"></div>

        <div style="margin-top: 20px; display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-primary" id="upload-settings-submit">
                <i class="fas fa-floppy-disk"></i> Lưu cấu hình upload
            </button>
        </div>
    </form>
</section>

<script>
    (function () {
        const form = document.getElementById('upload-settings-form');
        const input = document.getElementById('max_upload_mb');
        const statusEl = document.getElementById('upload-settings-status');
        const submitBtn = document.getElementById('upload-settings-submit');
        const endpoint = '../api/settings.php';

        if (!form || !input || !statusEl || !submitBtn) {
            return;
        }

        function setStatus(message, type) {
            statusEl.textContent = message;
            statusEl.style.display = message ? 'block' : 'none';
            statusEl.style.background =
                type === 'error' ? 'rgba(239, 68, 68, 0.12)' : type === 'success' ? 'rgba(34, 197, 94, 0.14)' : 'rgba(37, 99, 235, 0.12)';
            statusEl.style.color =
                type === 'error' ? '#991b1b' : type === 'success' ? '#166534' : '#1d4ed8';
            statusEl.style.border =
                type === 'error'
                    ? '1px solid rgba(239, 68, 68, 0.24)'
                    : type === 'success'
                        ? '1px solid rgba(34, 197, 94, 0.28)'
                        : '1px solid rgba(37, 99, 235, 0.22)';
        }

        async function requestSettings(method, body, fallbackMessage) {
            let response;
            let rawText = '';
            let payload = null;

            try {
                response = await fetch(endpoint, {
                    method,
                    headers: {
                        Accept: 'application/json',
                        ...(body ? { 'Content-Type': 'application/json' } : {})
                    },
                    ...(body ? { body: JSON.stringify(body) } : {})
                });
            } catch (error) {
                throw new Error(error?.message || fallbackMessage);
            }

            try {
                rawText = await response.text();
            } catch (error) {
                throw new Error(`Không thể đọc phản hồi API (HTTP ${response.status}).`);
            }

            if (rawText) {
                try {
                    payload = JSON.parse(rawText);
                } catch (error) {
                    payload = null;
                }
            }

            if (!response.ok) {
                throw new Error(
                    payload?.message ||
                    `API cấu hình upload trả lỗi HTTP ${response.status}.`
                );
            }

            if (!payload || payload?.success !== true) {
                throw new Error(payload?.message || fallbackMessage);
            }

            return payload;
        }

        async function loadSettings() {
            setStatus('Đang tải cấu hình upload...', 'info');
            try {
                const payload = await requestSettings('GET', null, 'Không thể tải cấu hình upload.');
                const nextValue = Number(payload?.data?.settings?.max_upload_mb || 25);
                input.value = Number.isFinite(nextValue) && nextValue > 0 ? String(nextValue) : '25';
                setStatus('', 'info');
            } catch (error) {
                setStatus(error.message || 'Không thể tải cấu hình upload.', 'error');
            }
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const maxUploadMb = Math.max(1, parseInt(input.value, 10) || 25);

            submitBtn.disabled = true;
            setStatus('Đang lưu cấu hình upload...', 'info');

            try {
                await requestSettings('POST', {
                    settings: {
                        max_upload_mb: maxUploadMb
                    }
                }, 'Không thể lưu cấu hình upload.');
                input.value = String(maxUploadMb);
                setStatus('Đã cập nhật dung lượng file upload tối đa.', 'success');
            } catch (error) {
                setStatus(error.message || 'Không thể lưu cấu hình upload.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        });

        loadSettings();
    })();
</script>

<?php include __DIR__ . '/../includes/footer_admin.php'; ?>
