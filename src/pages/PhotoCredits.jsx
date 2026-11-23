import { PageHero, Seo } from '../components/UI.jsx';

const credits = [
  ['Mumbai–Pune Expressway (hero)', 'Eloquent Insan', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Mumbai_Pune_Express_Way.jpg'],
  ['Maruti Suzuki Dzire', 'Biswarup Ganguly', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Dzire_VXi_VVT.JPG'],
  ['Maruti Suzuki Ertiga', 'Ramakrishna Mission Vidyapith', 'Public domain', 'https://commons.wikimedia.org/wiki/File:2022_Maruti_Suzuki_Ertiga_LXi.jpg'],
  ['Mumbai–Pune Expressway', 'Nikhil.kawale', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Mumbai-Pune_Expressway_1.JPG'],
  ['Shirdi Samadhi Mandir', "Prime Minister's Office", 'GODL-India', 'https://commons.wikimedia.org/wiki/File:Samadhi_Mandir_of_Shirdi_Sai_Baba.jpg'],
  ['Shani Shingnapur', 'Shivashanky', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Shree_Shanidev_Temple,_Shani_Shingnapur.jpg'],
  ['Trimbakeshwar', 'Niraj Suryawanshi', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Trimbakeshwar_nj.jpg'],
  ['Ramkund, Panchavati', 'Rohit R Nashik', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Makar_Sankranti_Celebration_at_Ramkund_Nashik_Maharashtra_14_Jan_2025_Rohit_R_Nashik_Photos_1.jpg'],
  ['Kalaram Temple', 'K.Venkataramana', 'CC0', 'https://commons.wikimedia.org/wiki/File:Kalaram_Temple,_Panchavati,_Nashik.jpg'],
  ['Saptashrungi', 'AmitUdeshi', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Goddess_Saptashrungi_Devi_Temple1.jpg'],
  ['Mahabaleshwar', 'B Balaji', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Mahabaleshwar_-_Needle-hole_Point_(5769812159).jpg'],
  ['Lonavala', 'Shishirdasika', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Lonavala_waterfalls.jpg'],
  ['Devkund', 'Kautuk1', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Devkund_waterfalls.jpg'],
  ['Guhagar', 'Mahendra5806', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Guhagar_Beach.JPG'],
  ['Ganpatipule', 'Sanjaybhagwat', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:GANPATIPULE_BEACH_(1).jpg'],
  ['Raigad Fort (Nagarkhana)', 'Nilamgandhre', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Nagarkhana,_Raigad_Fort,_India.jpg'],
  ['Tarkarli', 'Rohit Keluskar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Tarkarli_Photo_by_Sandeep_Wairkar1.jpg'],
  ['Kaas Plateau', 'Sheetal Kulkarni', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Kaas_plateau_flowers_1.jpg'],
  ['Harihareshwar', 'Dinesh Valke', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Harihareshwar_beach_(51733119386).jpg'],
  ['Malshej Ghat', 'Dinesh Valke', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Malshej_Ghat_(51546139549).jpg'],
];

export default function PhotoCredits() {
  return (
    <>
      <Seo title="Photo credits" path="/photo-credits" description="Credits and licences for photos used on this website, sourced from Wikimedia Commons." />
      <PageHero title="Photo credits" text="Photos on this website are from Wikimedia Commons and are used under the licences listed below." crumb="Photo credits" />
      <section className="container-x py-12 sm:py-16">
        <ul className="mx-auto max-w-3xl divide-y divide-navy-100 rounded-2xl bg-white shadow-card ring-1 ring-navy-100">
          {credits.map(([photo, author, license, url]) => (
            <li key={url} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="font-semibold text-navy-900">{photo}</p>
                <p className="text-sm text-slate-600">{author} · {license}</p>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-semibold text-saffron-600 underline underline-offset-2 hover:text-saffron-500">
                View on Commons<span className="sr-only"> ({photo})</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
