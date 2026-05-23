import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

interface PrivacyPolicyProps {
    updatedAt: string;
}

export default function PrivacyPolicy({ updatedAt }: PrivacyPolicyProps) {
    const { props } = usePage<SharedData>();
    const appName = props.name || 'AI Food App';

    return (
        <>
            <Head title="Gizlilik Politikasi" />
            <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
                <article className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <Link href="/" className="text-sm font-medium text-blue-600">
                            {appName}
                        </Link>
                        <h1 className="mt-3 text-3xl font-semibold">Gizlilik Politikasi</h1>
                        <p className="mt-2 text-sm text-slate-500">Son guncelleme: {updatedAt}</p>
                        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            Bu metin deneme amaclidir. Yayinlamadan once uygulamanizin gercek veri toplama, saklama ve
                            ucuncu taraf servis kullanimina gore duzenleyin.
                        </p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">Topladigimiz Bilgiler</h2>
                        <p>
                            {appName}, hesap olusturma, uygulama kullanimi, tarif kaydetme, premium abonelik ve yapay zeka
                            ozelliklerini calistirma amaciyla ad, e-posta, kullanici kimligi, tercih bilgileri ve uygulama
                            ici etkinlik verilerini isleyebilir.
                        </p>

                        <h2 className="text-xl font-semibold">Bilgileri Nasil Kullaniriz</h2>
                        <p>
                            Verileriniz hesabinizin yonetilmesi, uygulama deneyiminin iyilestirilmesi, abonelik durumunun
                            dogrulanmasi, destek taleplerinin yanitlanmasi ve guvenlik kontrollerinin saglanmasi icin
                            kullanilir.
                        </p>

                        <h2 className="text-xl font-semibold">Ucuncu Taraf Servisler</h2>
                        <p>
                            Uygulama; kimlik dogrulama ve veri saklama icin Firebase, abonelik yonetimi icin RevenueCat,
                            analiz icin Firebase Analytics/Google Analytics ve yapay zeka ozellikleri icin Google Gemini
                            servislerini kullanabilir.
                        </p>

                        <h2 className="text-xl font-semibold">Abonelik ve Odeme Bilgileri</h2>
                        <p>
                            Odeme islemleri uygulama magazalari veya odeme saglayicilari tarafindan yurutulur. {appName}
                            tam kart bilgilerinizi saklamaz. Abonelik durumu, urun bilgisi ve yenileme durumu gibi
                            bilgiler RevenueCat uzerinden islenebilir.
                        </p>

                        <h2 className="text-xl font-semibold">Veri Saklama ve Silme</h2>
                        <p>
                            Hesabinizla iliskili veriler hizmet sunumu icin gerekli oldugu surece saklanabilir. Hesap
                            silme veya veri talepleriniz icin iletisim kanalimizdan bize ulasabilirsiniz.
                        </p>

                        <h2 className="text-xl font-semibold">Iletisim</h2>
                        <p>
                            Gizlilik politikasiyla ilgili sorulariniz icin bu alana e-posta adresinizi veya destek
                            baglantinizi ekleyin.
                        </p>
                    </section>
                </article>
            </main>
        </>
    );
}
