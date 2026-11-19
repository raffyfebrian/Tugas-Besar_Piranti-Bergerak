import { expect, test, type Locator, type Page } from '@playwright/test';

/** IonButton membungkus teks di light DOM, jadi filter HasText pada host lebih awet. */
const ionButton = (page: Page, label: string): Locator => page.locator('ion-button').filter({ hasText: label }).first();

/** Ionic menyimpan halaman lama di DOM; role=main hanya muncul pada halaman aktif. */
const currentPage = (page: Page): Locator => page.getByRole('main');

const roleTab = (page: Page, label: string): Locator =>
  page.locator('button.segment-btn').filter({ hasText: label }).first();

const loginAs = async (page: Page, role: 'Kasir' | 'Kitchen') => {
  await page.goto('/staff');
  await roleTab(page, role).click();
  await ionButton(page, `Masuk sebagai ${role}`).click();
  await expect(page).toHaveURL(role === 'Kasir' ? /\/staff\/kasir$/ : /\/staff\/kitchen$/);
};

test('beranda publik merender konten Ngoffe ID', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#public-content')).toContainText('Ngoffe ID');
  await expect(page.locator('#public-content')).toContainText('Menu favorit tamu');
  await expect(page.locator('.menu-card')).toHaveCount(4);
});

test('alur lengkap tamu → kasir → dapur → tamu', async ({ page }) => {
  test.setTimeout(120_000);

  // Tamu memindai QR kamar (simulasi) lalu menambah menu.
  await page.goto('/order');
  await page.getByText('Simulasikan Scan QR').click();
  await expect(page.locator('ion-modal')).toBeVisible();
  await page.locator('ion-modal button.room-choice').first().click();
  await expect(page).toHaveURL(/\/order\/menu$/);

  await page.locator('button[aria-label="Tambah Espresso"]').click();
  await ionButton(page, 'Lihat Keranjang').click();
  await expect(page).toHaveURL(/\/order\/cart$/);

  // Pilih cash agar tidak perlu mengunggah bukti QRIS.
  await page.locator('.pay-option').filter({ hasText: 'Cash' }).click();
  await ionButton(page, 'Lanjut ke Pembayaran').click();
  await expect(page).toHaveURL(/\/order\/payment\//);

  await ionButton(page, 'Konfirmasi Pesanan').click();
  await expect(page).toHaveURL(/\/order\/status\//);
  const statusUrl = page.url();
  const code = (await page.locator('.order-code').first().innerText()).trim();
  expect(code).toMatch(/^NGF-\d{8}-\d{4}$/);
  await expect(currentPage(page)).toContainText('Menunggu Validasi');

  // Kasir memvalidasi pembayaran.
  await loginAs(page, 'Kasir');
  await page.locator('.order-card').filter({ hasText: code }).click();
  await expect(page).toHaveURL(/\/staff\/kasir\/order\//);
  await ionButton(page, 'Validasi & Kirim ke Dapur').click();
  await expect(currentPage(page)).toContainText('Sedang disiapkan dapur');

  // Dapur memulai dan menyelesaikan item, lalu menandai pesanan siap.
  await loginAs(page, 'Kitchen');
  const ticket = page.locator('.kitchen-ticket').filter({ hasText: code });
  await expect(ticket).toBeVisible();
  await ticket.locator('ion-button').filter({ hasText: 'Mulai masak' }).click();
  await ticket.locator('ion-button').filter({ hasText: 'Selesai' }).click();
  await ticket.locator('ion-button').filter({ hasText: 'Tandai Siap' }).click();

  await page.locator('button.segment-btn').filter({ hasText: 'Siap Diantar' }).click();
  await expect(page.locator('.kitchen-ticket').filter({ hasText: code })).toContainText('Menunggu diantar');

  // Tamu melihat status terbaru.
  await page.goto(statusUrl);
  await expect(currentPage(page)).toContainText('Siap Diantar');

  // Kasir mengantar lalu menyelesaikan pesanan.
  await loginAs(page, 'Kasir');
  await page.locator('.order-card').filter({ hasText: code }).click();
  await ionButton(page, 'Mulai Antar ke Kamar').click();
  await ionButton(page, 'Selesaikan Pesanan').click();
  await expect(currentPage(page)).toContainText('Pesanan sudah selesai');

  await page.goto(statusUrl);
  await expect(currentPage(page)).toContainText('Selesai');
});
