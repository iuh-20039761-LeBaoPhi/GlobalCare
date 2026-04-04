<?php
declare(strict_types=1);

require_once __DIR__ . '/slidebar.php';
require_once __DIR__ . '/get_hoadon.php';
require_once __DIR__ . '/get_nhanvien.php';

$admin = admin_require_login();
$id = (int)($_GET['id'] ?? 0);

$detail = get_hoadon_by_id($id);
$row = $detail['row'] ?? null;
$error = (string)($detail['error'] ?? '');

$nhanVienRow = null;
if (is_array($row)) {
	$nhanVienId = (int)($row['id_nhacungcap'] ?? 0);
	if ($nhanVienId > 0) {
		$nhanVienDetail = get_nhanvien_by_id($nhanVienId);
		$nhanVienRow = is_array($nhanVienDetail['row'] ?? null) ? $nhanVienDetail['row'] : null;
	}
}

admin_render_layout_start('Chi Tiet Hoa Don', 'orders', $admin);
?>

<style>
	.admin-main,
	.admin-main > main {
		background: #f3f7fb !important;
	}

	.od-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.od-title {
		margin: 0;
		font-size: 1.45rem;
		font-weight: 800;
		color: #0e2e4f;
	}

	.od-head-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.od-chip {
		display: inline-flex;
		align-items: center;
		padding: 5px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
		background: #e4f8ec;
		color: #178157;
		border: 1px solid #c6ecd6;
	}

	.od-back-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.32rem 0.8rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #2f8fe8, #1f6ec9);
		color: #ffffff;
		border: 1px solid #65a9ec;
		font-weight: 600;
		font-size: 0.8rem;
		text-decoration: none;
	}

	.od-back-btn:hover {
		background: linear-gradient(135deg, #1e79d6, #165fb2);
		color: #ffffff;
	}

	.od-alert {
		border-radius: 9px;
		background: #e9f2fb;
		border: 1px solid #d3e5f7;
		color: #2f587d;
		padding: 10px 12px;
		font-weight: 700;
		margin-bottom: 10px;
	}

	.od-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.od-card {
		background: #ffffff;
		border: 1px solid #d6e3f0;
		border-radius: 11px;
		box-shadow: 0 4px 14px rgba(14, 32, 58, 0.05);
		overflow: hidden;
	}

	.od-card.wide {
		grid-column: 1 / -1;
	}

	.od-hero {
		padding: 12px;
		background: linear-gradient(115deg, #1f66c6 0%, #1282d3 50%, #12a58d 100%);
		color: #ffffff;
	}

	.od-hero-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 14px;
	}

	.od-order-id {
		margin: 0;
		font-size: 1.95rem;
		font-weight: 800;
		line-height: 1;
	}

	.od-status-pill {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 800;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.35);
		margin-left: 6px;
	}

	.od-service {
		margin: 4px 0 7px;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.od-tools {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.od-tool {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		font-size: 10px;
		font-weight: 700;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.od-progress-ring {
		--p: 0;
		width: 94px;
		height: 94px;
		padding: 5px;
		border-radius: 50%;
		background: conic-gradient(#b7f5d7 calc(var(--p) * 1%), rgba(255, 255, 255, 0.24) 0);
	}

	.od-progress-core {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: grid;
		place-content: center;
		text-align: center;
		background: rgba(21, 81, 132, 0.45);
	}

	.od-progress-core strong {
		font-size: 1.85rem;
		line-height: 1;
	}

	.od-progress-core small {
		font-size: 10px;
		font-weight: 700;
	}

	.od-hero-grid {
		margin-top: 10px;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.od-box {
		border-radius: 8px;
		padding: 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(16, 62, 114, 0.2);
	}

	.od-box-label {
		margin: 0;
		font-size: 10px;
		font-weight: 700;
		opacity: 0.88;
	}

	.od-box-value {
		margin: 2px 0 0;
		font-size: 1.92rem;
		font-weight: 800;
		line-height: 1.2;
		word-break: break-word;
	}

	.od-box-sub {
		margin: 1px 0 0;
		font-size: 11px;
		font-weight: 600;
	}

	.od-panel-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding: 11px 12px;
		border-bottom: 1px solid #e2ebf5;
		background: #f6faff;
	}

	.od-panel-title {
		margin: 0;
		font-size: 1.08rem;
		font-weight: 800;
		color: #1f3b57;
	}

	.od-job-count {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 800;
		color: #138157;
		background: #ddf8ea;
		border: 1px solid #c4edd5;
	}

	.od-jobs-body {
		padding: 12px;
		background: #ecf8f2;
	}

	.od-jobs-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 8px;
		counter-reset: od-job;
	}

	.od-jobs-list li {
		counter-increment: od-job;
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 10px;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.4);
		border: 1px solid #cce7d8;
		font-weight: 600;
		font-size: 13px;
		line-height: 1.4;
		color: #2b4a65;
	}

	.od-jobs-list li::before {
		content: counter(od-job);
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 800;
		background: #16a46d;
		color: #fff;
		flex: 0 0 22px;
		margin-top: 1px;
	}

	.od-jobs-foot {
		padding: 10px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 7px;
		border-top: 1px solid #e2ebf5;
		background: #fff;
	}

	.od-mini {
		border: 1px solid #c8d8ea;
		background: #dfe9f7;
		border-radius: 8px;
		padding: 7px 9px;
	}

	.od-mini p {
		margin: 0;
	}

	.od-mini .k {
		font-size: 10px;
		font-weight: 700;
		color: #46627d;
	}

	.od-mini .v {
		font-size: 13px;
		font-weight: 700;
		color: #1e3a58;
	}

	.od-progress-body {
		padding: 12px;
	}

	.od-progress-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 700;
		color: #3c5772;
	}

	.od-progress-track {
		height: 10px;
		border-radius: 999px;
		background: #dce9f6;
		overflow: hidden;
		margin-top: 6px;
	}

	.od-progress-fill {
		height: 100%;
		width: 0;
		background: linear-gradient(90deg, #16a56d, #2dcf92);
	}

	.od-progress-note {
		margin: 8px 0 10px;
		font-size: 12px;
		font-weight: 600;
		color: #5c738a;
	}

	.od-timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 8px;
	}

	.od-timeline li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding-left: 20px;
		position: relative;
		font-size: 13px;
		font-weight: 700;
		color: #2a445e;
	}

	.od-timeline li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 7px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid #c9d9ea;
		background: #fff;
	}

	.od-timeline li.done::before,
	.od-timeline li.active::before {
		border-color: #16a56d;
		background: #16a56d;
	}

	.od-timeline li span {
		font-size: 12px;
		font-weight: 600;
		color: #667f98;
	}

	.od-next {
		margin-top: 10px;
		padding: 10px;
		border-radius: 8px;
		border: 1px solid #d6e4f2;
		background: #eef5ff;
		font-size: 12px;
		font-weight: 700;
		color: #385573;
	}

	.od-profile-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding: 11px 12px;
		border-bottom: 1px solid #e2ebf5;
		background: #f8fbff;
	}

	.od-profile-title {
		margin: 0;
		font-size: 1.03rem;
		font-weight: 800;
		color: #1f3a57;
	}

	.od-profile-body {
		padding: 12px;
		display: grid;
		grid-template-columns: 72px 1fr;
		gap: 12px;
	}

	.od-avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #deebf9;
		background: #d6e4f4;
	}

	.od-name {
		margin: 0;
		font-size: 1.45rem;
		font-weight: 800;
		line-height: 1.2;
		color: #223e59;
	}

	.od-rating {
		margin: 4px 0 6px;
		font-size: 13px;
		font-weight: 700;
		color: #566d83;
	}

	.od-rating i {
		color: #f2b019;
		margin-right: 4px;
	}

	.od-info-row {
		margin: 0;
		font-size: 13px;
		font-weight: 700;
		color: #2b4964;
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.od-info-row i {
		color: #60a5fa;
	}

	.od-profile-foot {
		padding: 0 12px 12px;
	}

	.od-exp {
		display: inline-flex;
		align-items: center;
		padding: 7px 10px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 700;
		background: #eef2f6;
		color: #52667c;
	}

	.od-review-body {
		padding: 11px 12px;
		display: grid;
		gap: 8px;
	}

	.od-review-box {
		border: 1px solid #d8e5f3;
		border-radius: 8px;
		padding: 8px;
		background: #f8fbff;
	}

	.od-review-label {
		margin: 0 0 3px;
		font-size: 10px;
		font-weight: 700;
		color: #57708a;
	}

	.od-review-value {
		margin: 0;
		font-size: 12px;
		font-weight: 700;
		color: #2d4b67;
		white-space: pre-line;
		word-break: break-word;
	}

	@media (max-width: 1199px) {
		.od-grid,
		.od-hero-grid,
		.od-jobs-foot {
			grid-template-columns: 1fr;
		}

		.od-profile-body {
			grid-template-columns: 1fr;
		}

		.od-hero-top {
			flex-direction: column;
		}
	}
</style>

<div class="od-head">
	<h2 class="od-title">Chi tiet hoa don me va be</h2>
	<div class="od-head-actions">
		<span class="od-chip">Vai tro: Nha Cung Cap</span>
		<a href="quan-ly-hoa-don.php" class="od-back-btn"><i class="bi bi-arrow-left-circle me-1"></i>Quay lai</a>
	</div>
</div>

<?php if ($error !== '' || !is_array($row)): ?>
	<div class="alert alert-warning"><?= admin_h($error !== '' ? $error : 'Khong tim thay hoa don.') ?></div>
<?php else: ?>
	<?php
		$statusMeta = hoadon_status_meta((string)($row['trangthai'] ?? ''));
		$statusText = (string)($statusMeta['text'] ?? ($row['trangthai'] ?? ''));
		$statusRaw = strtolower(trim($statusText));

		$progress = (float)($row['tien_do'] ?? 0);
		$progress = max(0, min(100, $progress));
		$progressText = rtrim(rtrim(number_format($progress, 2, '.', ''), '0'), '.');

		$priceRaw = trim((string)($row['tong_tien'] ?? '0'));
		$priceDigits = preg_replace('/[^0-9]/', '', $priceRaw);
		$priceNum = $priceDigits !== '' ? (float)$priceDigits : 0.0;
		$priceText = $priceNum > 0 ? number_format($priceNum, 0, ',', '.') . ' VND' : ($priceRaw !== '' ? $priceRaw : '0 VND');

		$dateStart = trim((string)($row['ngay_bat_dau'] ?? ''));
		$dateEnd = trim((string)($row['ngay_ket_thuc'] ?? ''));
		$timeStart = trim((string)($row['gio_bat_dau'] ?? ''));
		$timeEnd = trim((string)($row['gio_ket_thuc'] ?? ''));
		$timeRange = ($timeStart !== '' || $timeEnd !== '') ? trim(($timeStart !== '' ? $timeStart : '--:--') . ' - ' . ($timeEnd !== '' ? $timeEnd : '--:--')) : '--:-- - --:--';
		$dateRange = ($dateStart !== '' || $dateEnd !== '') ? trim(($dateStart !== '' ? $dateStart : '---') . ($dateEnd !== '' ? (' -> ' . $dateEnd) : '')) : '---';

		$address = trim((string)($row['diachi'] ?? 'N/A'));
		$requestText = trim((string)($row['yeu_cau_khac'] ?? 'Khong co'));
		$noteText = trim((string)($row['ghi_chu'] ?? 'Khong co'));

		$jobsRaw = trim((string)($row['cong_viec'] ?? ''));
		$jobItems = [];
		if ($jobsRaw !== '') {
			$jobsNormalized = preg_replace('/\s+/u', ' ', $jobsRaw) ?? $jobsRaw;
			$parts = preg_split('/\s*[\.\x{3002}]\s*/u', $jobsNormalized) ?: [];
			foreach ($parts as $part) {
				$clean = trim((string)$part);
				$clean = preg_replace('/^[,;:\-\s]+/u', '', $clean) ?? $clean;
				if ($clean !== '') {
					$jobItems[] = $clean;
				}
			}
		}
		if (!$jobItems) {
			$jobItems = ['Chua cap nhat cong viec'];
		}
		$jobCount = count($jobItems);

		$startReal = trim((string)($row['thoigian_batdau_thucte'] ?? ''));
		$endReal = trim((string)($row['thoigian_ketthuc_thucte'] ?? ''));
		$createdDate = trim((string)($row['created_date'] ?? ''));
		$updatedAt = $endReal !== '' ? $endReal : ($startReal !== '' ? $startReal : ($createdDate !== '' ? $createdDate : 'N/A'));

		$hasStart = $startReal !== '';
		$hasEnd = $endReal !== '';
		$isDone = (strpos($statusRaw, 'hoan thanh') !== false) || $hasEnd;
		$isRunning = (strpos($statusRaw, 'dang') !== false) && !$isDone;

		$customerName = trim((string)($row['hovaten'] ?? 'N/A'));
		$customerPhone = trim((string)($row['sodienthoai'] ?? 'N/A'));
		$customerEmail = trim((string)($row['email'] ?? 'N/A'));
		$customerAvatar = trim((string)($row['anh_dai_dien'] ?? ''));

		$supplierName = is_array($nhanVienRow) ? trim((string)($nhanVienRow['hovaten'] ?? 'N/A')) : trim((string)($row['hotenncc'] ?? 'Chua phan cong'));
		$supplierPhone = is_array($nhanVienRow) ? trim((string)($nhanVienRow['sodienthoai'] ?? 'N/A')) : trim((string)($row['sodienthoaincc'] ?? 'N/A'));
		$supplierAddress = is_array($nhanVienRow) ? trim((string)($nhanVienRow['diachi'] ?? 'N/A')) : trim((string)($row['diachincc'] ?? 'N/A'));
		$supplierAvatar = is_array($nhanVienRow) ? trim((string)($nhanVienRow['anh_dai_dien'] ?? '')) : '';
		$supplierExp = is_array($nhanVienRow) ? trim((string)($nhanVienRow['kinh_nghiem'] ?? 'Khong co')) : 'Khong co';
		$supplierRating = is_array($nhanVienRow) ? trim((string)($nhanVienRow['diem_danhgia'] ?? $nhanVienRow['rating'] ?? '')) : '';
		$supplierReviews = is_array($nhanVienRow) ? trim((string)($nhanVienRow['so_danh_gia'] ?? $nhanVienRow['review_count'] ?? '')) : '';
		$supplierRatingText = $supplierRating !== '' ? ($supplierRating . ($supplierReviews !== '' ? (' (' . $supplierReviews . ' danh gia)') : '')) : 'Chua co danh gia';
		$supplierAssigned = (int)($row['id_nhacungcap'] ?? 0) > 0;

		$reviewCustomer = trim((string)($row['danhgia_khachhang'] ?? ''));
		$reviewSupplier = trim((string)($row['danhgia_nhanvien'] ?? ''));
		$reviewCustomerAt = trim((string)($row['thoigian_danhgia_khachhang'] ?? ''));
		$reviewSupplierAt = trim((string)($row['thoigian_danhgia_nhanvien'] ?? ''));
	?>

	<div class="od-alert">Tai du lieu thanh cong</div>

	<section class="od-grid">
		<article class="od-card od-hero wide">
			<div class="od-hero-top">
				<div>
					<h3 class="od-order-id">
						Don #<?= admin_h((string)($row['id'] ?? '')) ?>
						<span class="od-status-pill"><?= admin_h($statusText !== '' ? $statusText : 'N/A') ?></span>
					</h3>
					<p class="od-service"><?= admin_h((string)($row['dich_vu'] ?? 'N/A')) ?></p>
					<div class="od-tools">
						<span class="od-tool">Ho tro</span>
						<span class="od-tool">Ma HD: <?= admin_h((string)($row['id'] ?? '')) ?></span>
					</div>
				</div>
				<div class="od-progress-ring" style="--p:<?= admin_h($progressText) ?>;">
					<div class="od-progress-core">
						<strong><?= admin_h($progressText) ?>%</strong>
						<small>Hoan thanh</small>
					</div>
				</div>
			</div>
			<div class="od-hero-grid">
				<div class="od-box">
					<p class="od-box-label">Tong tien</p>
					<p class="od-box-value"><?= admin_h($priceText) ?></p>
				</div>
				<div class="od-box">
					<p class="od-box-label">Thoi gian</p>
					<p class="od-box-value"><?= admin_h($timeRange) ?></p>
					<p class="od-box-sub"><?= admin_h($dateRange) ?></p>
				</div>
				<div class="od-box">
					<p class="od-box-label">Dia chi</p>
					<p class="od-box-value"><?= admin_h($address) ?></p>
				</div>
			</div>
		</article>

		<article class="od-card">
			<div class="od-panel-head">
				<h4 class="od-panel-title">Cong viec can thuc hien</h4>
				<span class="od-job-count"><?= admin_h((string)$jobCount) ?>/<?= admin_h((string)$jobCount) ?> da hoan thanh</span>
			</div>
			<div class="od-jobs-body">
				<ol class="od-jobs-list">
					<?php foreach ($jobItems as $item): ?>
						<li><?= admin_h($item) ?></li>
					<?php endforeach; ?>
				</ol>
			</div>
			<div class="od-jobs-foot">
				<div class="od-mini">
					<p class="k">Goi dich vu</p>
					<p class="v"><?= admin_h((string)($row['goi_dich_vu'] ?? 'N/A')) ?></p>
				</div>
				<div class="od-mini">
					<p class="k">Yeu cau</p>
					<p class="v"><?= admin_h($requestText !== '' ? $requestText : 'Khong co') ?></p>
				</div>
				<div class="od-mini" style="grid-column:1/-1;">
					<p class="k">Ghi chu</p>
					<p class="v"><?= admin_h($noteText !== '' ? $noteText : 'Khong co') ?></p>
				</div>
			</div>
		</article>

		<article class="od-card">
			<div class="od-panel-head">
				<h4 class="od-panel-title">Tien do thuc hien</h4>
				<span class="od-job-count">Cap nhat: <?= admin_h($updatedAt) ?></span>
			</div>
			<div class="od-progress-body">
				<div class="od-progress-top">
					<span>Tien do cong don</span>
					<span><?= admin_h($progressText) ?>%</span>
				</div>
				<div class="od-progress-track"><div class="od-progress-fill" style="width:<?= admin_h($progressText) ?>%;"></div></div>
				<p class="od-progress-note">Tien do theo tung ngay, moi ngay la 1 ca <?= admin_h($timeRange) ?>. Khoang ngay ke hoach: <?= admin_h($dateRange) ?>.</p>
				<ul class="od-timeline">
					<li class="<?= $hasStart ? 'done' : 'pending' ?>">Bat dau ca <span><?= admin_h($startReal !== '' ? $startReal : ($dateStart !== '' ? $dateStart . ' ' . ($timeStart !== '' ? $timeStart : '--:--') : 'N/A')) ?></span></li>
					<li class="<?= $isRunning ? 'active' : ($hasEnd ? 'done' : 'pending') ?>">Dang thuc hien <span><?= admin_h($timeRange) ?></span></li>
					<li class="<?= $hasEnd ? 'done' : 'pending' ?>">Chuan bi ket thuc <span><?= admin_h($timeEnd !== '' ? $timeEnd : 'N/A') ?></span></li>
					<li class="<?= $isDone ? 'done' : 'pending' ?>">Hoan thanh <span><?= admin_h($endReal !== '' ? $endReal : ($dateEnd !== '' ? $dateEnd . ' ' . ($timeEnd !== '' ? $timeEnd : '--:--') : 'N/A')) ?></span></li>
				</ul>
				<div class="od-next">Ca tiep theo<br>Khoang ngay: <?= admin_h($dateRange) ?></div>
			</div>
		</article>

		<article class="od-card">
			<div class="od-profile-head">
				<h4 class="od-profile-title">Khach hang</h4>
				<span class="od-job-count" style="background:#e8f7ff;color:#1c6aa8;border-color:#d0eafb;">Khach hang</span>
			</div>
			<div class="od-profile-body">
				<img class="od-avatar" src="<?= admin_h($customerAvatar !== '' ? $customerAvatar : '../assets/logomvb.png') ?>" alt="Khach hang">
				<div>
					<p class="od-name"><?= admin_h($customerName) ?></p>
					<p class="od-rating"><i class="bi bi-star-fill"></i><?= admin_h($customerEmail) ?></p>
					<p class="od-info-row"><i class="bi bi-telephone"></i><?= admin_h($customerPhone) ?></p>
					<p class="od-info-row"><i class="bi bi-geo-alt"></i><?= admin_h($address) ?></p>
				</div>
			</div>
			<div class="od-profile-foot"><span class="od-exp">Ngay tao: <?= admin_h($createdDate !== '' ? $createdDate : 'N/A') ?></span></div>
		</article>

		<article class="od-card">
			<div class="od-profile-head">
				<h4 class="od-profile-title">Nha Cung Cap phu trach</h4>
				<span class="od-job-count" style="<?= $supplierAssigned ? 'background:#def8ea;color:#138259;border-color:#c4edd5;' : 'background:#fff4df;color:#996316;border-color:#f0ddb4;' ?>"><?= $supplierAssigned ? 'Da nhan' : 'Chua nhan' ?></span>
			</div>
			<div class="od-profile-body">
				<img class="od-avatar" src="<?= admin_h($supplierAvatar !== '' ? $supplierAvatar : '../assets/logomvb.png') ?>" alt="Nha Cung Cap">
				<div>
					<p class="od-name"><?= admin_h($supplierName !== '' ? $supplierName : 'Chua phan cong') ?></p>
					<p class="od-rating"><i class="bi bi-star-fill"></i><?= admin_h($supplierRatingText) ?></p>
					<p class="od-info-row"><i class="bi bi-telephone"></i><?= admin_h($supplierPhone !== '' ? $supplierPhone : 'N/A') ?></p>
					<p class="od-info-row"><i class="bi bi-geo-alt"></i><?= admin_h($supplierAddress !== '' ? $supplierAddress : 'N/A') ?></p>
				</div>
			</div>
			<div class="od-profile-foot"><span class="od-exp">Kinh nghiem: <?= admin_h($supplierExp !== '' ? $supplierExp : 'Khong co') ?></span></div>
		</article>

		<article class="od-card">
			<div class="od-profile-head">
				<h4 class="od-profile-title">Danh gia khach hang</h4>
				<span class="od-job-count" style="background:#fff4df;color:#996316;border-color:#f0ddb4;"><?= $reviewCustomer !== '' ? 'Da co' : 'Chua co' ?></span>
			</div>
			<div class="od-review-body">
				<div class="od-review-box">
					<p class="od-review-label">Noi dung danh gia</p>
					<p class="od-review-value"><?= admin_h($reviewCustomer !== '' ? $reviewCustomer : 'Chua co danh gia') ?></p>
				</div>
				<div class="od-review-box">
					<p class="od-review-label">Thoi gian gui</p>
					<p class="od-review-value"><?= admin_h($reviewCustomerAt !== '' ? $reviewCustomerAt : '---') ?></p>
				</div>
			</div>
		</article>

		<article class="od-card">
			<div class="od-profile-head">
				<h4 class="od-profile-title">Danh gia nha cung cap</h4>
				<span class="od-job-count" style="background:#fff4df;color:#996316;border-color:#f0ddb4;"><?= $reviewSupplier !== '' ? 'Da co' : 'Chua co' ?></span>
			</div>
			<div class="od-review-body">
				<div class="od-review-box">
					<p class="od-review-label">Noi dung danh gia</p>
					<p class="od-review-value"><?= admin_h($reviewSupplier !== '' ? $reviewSupplier : 'Chua co danh gia') ?></p>
				</div>
				<div class="od-review-box">
					<p class="od-review-label">Thoi gian gui</p>
					<p class="od-review-value"><?= admin_h($reviewSupplierAt !== '' ? $reviewSupplierAt : '---') ?></p>
				</div>
			</div>
		</article>
	</section>
<?php endif; ?>

<?php admin_render_layout_end(); ?>
