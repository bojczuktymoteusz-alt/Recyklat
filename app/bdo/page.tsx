export default function BDOPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      <section className="max-w-5xl mx-auto px-6 py-20">
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-6">
          BDO Administration for Foreign Companies Selling in Poland
        </h1>

        <p className="text-lg md:text-xl text-slate-600 font-medium mb-10 leading-relaxed">
          We help foreign companies manage their Polish BDO obligations and administration.
        </p>

        <ul className="space-y-3 text-slate-700 text-lg md:text-xl font-medium mb-12">
          <li>BDO registration assistance</li>
          <li>BDO account administration</li>
          <li>BDO records and reporting</li>
          <li>Updates and administrative support</li>
          <li>Local support in Poland</li>
        </ul>

        <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed mb-16">
          Your company remains the BDO account holder. We can act as your authorised representative/proxy for BDO administration in Poland.
        </p>

        <img
          src="/bdo.jpg"
          alt="BDO Services"
          className="rounded-2xl shadow-lg w-full"
        />

      </section>
    </main>
  );
}
