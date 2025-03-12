import { Button } from "@/components/ui/button";
import Link from "next/link";


//  View Dashboard
export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-xl mx-auto flex justify-center items-center">
        <Link href="/dashboard" passHref>
          <Button className="bg-emerald-500 text-white">View Dashboard</Button>
        </Link>
      </main>
    </div>
  );
}
