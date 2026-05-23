import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

interface TermsOfServiceProps {
    updatedAt: string;
}

export default function TermsOfService({ updatedAt }: TermsOfServiceProps) {
    const { props } = usePage<SharedData>();
    const appName = props.name || 'AI Food App';

    return (
        <>
            <Head title="Hizmet Sartlari" />
            <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
                <article className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <Link href="/" className="text-sm font-medium text-blue-600">
                            {appName}
                        </Link>
                        <h1 className="mt-3 text-3xl font-semibold">Hizmet Sartlari</h1>
                        <p className="mt-2 text-sm text-slate-500">Son guncelleme: {updatedAt}</p>
                        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            Bu metin deneme amaclidir. Yayinlamadan once uygulamanizin gercek kosullarina ve yerel
                            mevzuata gore duzenleyin.
                        </p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">Hizmetin Kullanimi</h2>
                        <p>
                            {appName}, tarif kesfi, beslenme planlama, topluluk paylasimlari ve yapay zeka destekli
                            oneriler sunan bir uygulamadir. Hizmeti kullanarak bu sartlari kabul etmis sayilirsiniz.
                        </p>

                        <h2 className="text-xl font-semibold">Hesap Sorumlulugu</h2>
                        <p>
                            Hesap bilgilerinizin dogrulugundan ve hesabiniz uzerinden gerceklesen islemlerden siz
                            sorumlusunuz. Hesabinizda yetkisiz kullanim fark ederseniz destek ekibiyle iletisime gecin.
                        </p>

                        <h2 className="text-xl font-semibold">Yapay Zeka Ciktilari</h2>
                        <p>
                            Uygulamada uretilen beslenme, tarif veya saglikla ilgili oneriler bilgilendirme amaclidir.
                            Profesyonel tibbi, diyetetik veya hukuki tavsiye yerine gecmez.
                        </p>

                        <h2 className="text-xl font-semibold">Premium Abonelikler</h2>
                        <p>
                            Premium ozellikler uygulama magazalari veya desteklenen odeme saglayicilari uzerinden
                            sunulabilir. Yenileme, iptal ve iade kosullari ilgili magazanin veya odeme saglayicisinin
                            kurallarina tabidir.
                        </p>

                        <h2 className="text-xl font-semibold">Kabul Edilmeyen Kullanim</h2>
                        <p>
                            Hizmeti yasa disi faaliyetler, baskalarinin haklarini ihlal eden icerikler, spam, tersine
                            muhendislik veya servis guvenligini bozacak davranislar icin kullanamazsiniz.
                        </p>

                        <h2 className="text-xl font-semibold">Degisiklikler</h2>
                        <p>
                            Bu sartlar zaman zaman guncellenebilir. Onemli degisikliklerde uygulama icinden veya uygun
                            iletisim kanallariyla bilgilendirme yapilabilir.
                        </p>

                        <h2 className="text-xl font-semibold">Iletisim</h2>
                        <p>
                            Hizmet sartlariyla ilgili sorulariniz icin bu alana e-posta adresinizi veya destek baglantinizi
                            ekleyin.
                        </p>
                    </section>
                </article>
            </main>
        </>
    );
}
