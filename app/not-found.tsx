import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] px-6 py-10 text-[#241f1a]">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7a4b2a]">404</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">页面不存在</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#5d564d]">
          当前链接没有对应的 Lexos 工作台内容。请返回首页，或从已有任务、客户门户、风控工单入口继续操作。
        </p>
        <div className="mt-8">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#241f1a] px-5 text-sm font-medium text-white transition hover:bg-[#3a3128]"
            href="/"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
