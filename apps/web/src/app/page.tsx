import MenuEmpty from '@/components/menu/MenuEmpty';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-[#183c2e]">
        BrewLite Coffee &amp; Tea
      </h1>
      {/* ponytail: Products API chưa có; thay bằng menu của Duy khi tích hợp. */}
      <div className="mt-8 w-full">
        <MenuEmpty />
      </div>
    </main>
  );
}
