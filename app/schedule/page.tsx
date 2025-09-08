import Image from "next/image"
import { MapPin } from "lucide-react"

export default function SchedulePage() {
  const scheduleItems = [
    {
      time: "8:00",
      period: "AM",
      title: "DOORS OPEN",
      description: "Ticket sales are available at the door. Registration for Show N Shine is open until 10 AM.",
      location: "NORTH LOT",
    },
    {
      time: "8:30",
      period: "AM",
      title: "RC COURSE OPEN",
      description:
        "A CruiserFest debut - enjoy RC crawler courses organized by local volunteers. Bring your scaled crawlers for a day of fun.",
      location: "NORTH LOT",
    },
    {
      time: "9:00",
      period: "AM",
      title: "MUSEUM TOUR",
      description: "Explore the museum collection with a guide. 60 minutes. Group meets at museum lobby.",
      location: "LOBBY",
    },
    {
      time: "10:00",
      period: "AM",
      title: "WORKSHOP WITH OVERLAND EXPERTS",
      description:
        "Skills training with industry leading offroad instructors. Compete in timed trials for prizes. Must pre-register.",
      location: "EAST ALLEY",
    },
    {
      time: "10:30",
      period: "AM",
      title: "PRESENTER: 4X4 ENGINEERING",
      description:
        "Manufacturers of offroad equipment since 1973. Meet the team from Japan and check out their latest offerings.",
      location: "TOYOTA STAGE",
    },
    {
      time: "11:00",
      period: "AM",
      title: "FOOD TRUCKS OPEN",
      description: "Hungry? Check in with our food truck vendors serving yum until 3:00 PM.",
      location: "SOUTH LOT",
    },
    {
      time: "11:15",
      period: "AM",
      title: "EXPEDITIONS: GREENLAND",
      description:
        "Meet the expedition team and watch the trailer for their latest documentary on their record Greenland crossing. In theatres for a limited time.",
      location: "TOYOTA STAGE",
    },
    {
      time: "11:30",
      period: "AM",
      title: "MUSEUM TOUR",
      description: "Explore the museum collection with a guide. 60 minutes. Group meets at museum lobby.",
      location: "LOBBY",
    },
    {
      time: "12:30",
      period: "PM",
      title: "SHOW N SHINE AWARDS",
      description:
        "You've voted for best of show. Now find out who wins in five categories in CruiserFest's Show N Shine competition. Thanks to Wasatch Cruisers.",
      location: "TOYOTA STAGE",
    },
    {
      time: "1:00",
      period: "PM",
      title: "FEATURE SPEAKERS: XOVERLAND + EXPEDITION PORTAL",
      description:
        "25K milestones expedition - Clay Croft presents crossing N. America, Europe, and preparing to cross Africa. Crossing continents: Scott Brady's 7 continent journey.",
      location: "TOYOTA STAGE",
    },
    {
      time: "3:00",
      period: "PM",
      title: "WORKSHOP WITH STATE AUTOMOTIVE",
      description:
        "You want to buy a Land Cruiser? Have a seat for a lecture on pre-purchase inspection tips and what to look for in a clean Land Cruiser. Presented by State Automotive's Dustin Stewart.",
      location: "AUDITORIUM",
    },
    {
      time: "4:00",
      period: "PM",
      title: "OPPORTUNITY DRAWING AWARDS",
      description:
        "Close out the day with us by winning top shelf gear from our amazing sponsors and partners. All ticket holders receive a drawing ticket and additional tickets are available to purchase. Must be present to win.",
      location: "TOYOTA STAGE",
    },
  ]

  return (
    <div className="bg-[#F2EEEB] min-h-screen">
      {/* Hero Section with Background */}
      <section className="relative py-20 text-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Green%20Cruiser.jpg"
            alt="Classic green cruiser car"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">EVENT SCHEDULE</h1>
          <div className="w-24 h-1 bg-[#BF6849] mx-auto mb-8"></div>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            CruiserFest 2025 • September 6th, 2025
          </p>
          <p className="text-lg text-white/80 max-w-3xl mx-auto drop-shadow-md">
            Join us for a full day of activities, presentations, workshops, and competitions celebrating the Land
            Cruiser community.
          </p>
        </div>
      </section>

      {/* Schedule Cards */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {scheduleItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Time Section */}
                  <div className="bg-[#BF6849] text-white p-6 md:w-48 flex flex-col justify-center items-center md:items-start">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">{item.time}</span>
                      <span className="text-lg font-medium opacity-90">{item.period}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.location}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6">
                    <h3 className="text-2xl font-bold text-[#3A403D] mb-3 tracking-wide">{item.title}</h3>
                    <p className="text-[#3A403D]/80 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
