import Image from 'next/image'

const partners = [
  {
    name: 'Bitxus',
    role: 'Student Publication',
    logo: '/partners/bitxus-publication.jpg',
  },
  {
    name: 'College of Computing Studies',
    role: 'CCS Department',
    logo: '/partners/CCS.jpg',
  },
]

export default function CampusPartners() {
  return (
    <section aria-labelledby="campus-partners-heading" className="border-y border-white/10 bg-black/20 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h2 id="campus-partners-heading" className="text-center text-2xl font-semibold text-white">
          Campus Partners
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12">
          {partners.map((partner) => (
            <li key={partner.logo} className="flex min-w-0 flex-col items-center text-center">
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                width={128}
                height={128}
                sizes="128px"
                className="h-32 w-32 rounded-full object-cover"
              />
              <h3 className="mt-4 max-w-full text-base font-semibold text-white">{partner.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{partner.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
