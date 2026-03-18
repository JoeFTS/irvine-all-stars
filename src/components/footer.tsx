import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-flag-blue text-white/50 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-star-gold-bright text-sm tracking-widest">
            &#9733;&#9733;&#9733;
          </span>
          <span className="font-display text-lg font-bold text-white uppercase tracking-wider">
            Irvine All-Stars
          </span>
          <span className="text-star-gold-bright text-sm tracking-widest">
            &#9733;&#9733;&#9733;
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/coaches" className="hover:text-white transition-colors py-1">
            Coaches
          </Link>
          <Link href="/tryouts" className="hover:text-white transition-colors py-1">
            Tryouts
          </Link>
          <Link
            href="/timeline"
            className="hover:text-white transition-colors py-1"
          >
            Timeline
          </Link>
          <Link
            href="/documents"
            className="hover:text-white transition-colors py-1"
          >
            Documents
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors py-1">
            FAQ
          </Link>
        </div>

        <div className="text-center md:text-right text-sm">
          <p className="text-white/70">Irvine Pony Baseball</p>
          <p>2026 All-Stars Season</p>
        </div>
      </div>
    </footer>
  );
}
