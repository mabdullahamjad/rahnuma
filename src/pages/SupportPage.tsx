export default function SupportPage() {
  return (
    <main className="md:ml-64 pb-28 md:pb-12 px-container-margin pt-lg max-w-4xl">
      <h1 className="text-headline-lg font-headline-lg text-primary mb-sm">Support</h1>
      <p className="text-body-md text-on-surface-variant mb-xl">Need help using Rahnuma? We&apos;re here to help.</p>

      <section className="bg-surface-container-low rounded-3xl p-lg mb-lg border border-outline-variant/10">
        <h2 className="text-title-lg font-title-lg text-primary mb-md">Common Issues</h2>
        <ul className="space-y-md text-body-md text-on-surface-variant list-disc pl-5">
          <li><strong className="text-on-surface">Location isn&apos;t working?</strong> Enable location permissions in your browser or device settings.</li>
          <li><strong className="text-on-surface">Can&apos;t find a place?</strong> Try searching with a more specific name or address. Rahnuma uses OpenStreetMap to find locations.</li>
          <li><strong className="text-on-surface">Incorrect route or station?</strong> Transit information may occasionally change. If you notice an error, please let us know.</li>
        </ul>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-lg mb-lg border border-outline-variant/10">
        <h2 className="text-title-lg font-title-lg text-primary mb-sm">Contact Us</h2>
        <p className="text-body-md text-on-surface-variant">For bug reports, feedback, or questions, contact us at <a className="text-primary font-semibold hover:underline" href="mailto:mabdullahamjad2006@gmail.com">mabdullahamjad2006@gmail.com</a>.</p>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-lg border border-outline-variant/10">
        <h2 className="text-title-lg font-title-lg text-primary mb-sm">Data Accuracy</h2>
        <p className="text-body-md text-on-surface-variant">Rahnuma uses OpenStreetMap and publicly available transit information to provide journey planning. While we strive to keep the information up to date, routes and services may change over time.</p>
      </section>
    </main>
  );
}
