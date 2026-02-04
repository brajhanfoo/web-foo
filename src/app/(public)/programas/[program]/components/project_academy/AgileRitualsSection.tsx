import {
    FiClock,
    FiCalendar,
    FiRefreshCcw,
    FiUsers,
} from "react-icons/fi";

type Ritual = {
    title: string;
    duration: string;
    description: string;
    accent: "emerald" | "violet" | "purple" | "lime";
    icon: React.ElementType;
};

const rituals: Ritual[] = [
    {
        title: "Daily Standup",
        duration: "15 min",
        description:
            "Blockers, progreso diario y alineación rápida del equipo.",
        accent: "emerald",
        icon: FiClock,
    },
    {
        title: "Sprint Planning",
        duration: "Bi-weekly",
        description:
            "Definición de alcance, estimación y compromiso de entrega.",
        accent: "violet",
        icon: FiCalendar,
    },
    {
        title: "Review & Retro",
        duration: "End of Sprint",
        description:
            "Demo a stakeholders y mejora continua de procesos.",
        accent: "purple",
        icon: FiRefreshCcw,
    },
    {
        title: "Weekly Sync",
        duration: "1-on-1",
        description:
            "Resolución de problemas técnicos complejos en profundidad.",
        accent: "lime",
        icon: FiUsers,
    },
];

const accentMap = {
    emerald: "bg-[#00CCA4]/15 text-[#00CCA4]",
    violet: "bg-[#77039F]/15 text-[#77039F]",
    purple: "bg-[#D85DFB]/15 text-[#D85DFB]",
    lime: "bg-[#BDBE0B]/15 text-[#BDBE0B]",
};


const AgileRitualsSection = () => {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            {/* Header */}
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <span className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium text-[#00CCA4]">
                        Realismo Operativo
                    </span>

                    <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
                        Rituales Ágiles
                    </h2>
                </div>

                <p className="max-w-sm text-sm text-white/50 md:text-right">
                    Sincronización y metodología de equipos de alto rendimiento.
                </p>
            </div>

            {/* Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {rituals.map((ritual) => {
                    const Icon = ritual.icon;

                    return (
                        <div
                            key={ritual.title}
                            className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/20"
                        >
                            {/* Duration */}
                            <span className="absolute right-5 top-5 text-xs text-white/30">
                                {ritual.duration}
                            </span>

                            {/* Icon */}
                            <div
                                className={`mb-5 flex h-10 w-10 items-center justify-center rounded-lg ${accentMap[ritual.accent]}`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>

                            {/* Content */}
                            <h3 className="text-base font-semibold text-white">
                                {ritual.title}
                            </h3>

                            <p className="mt-2 text-sm text-white/60">
                                {ritual.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <p className="mt-16 text-center text-sm text-white/60">
                Aquí no simulamos ceremonias.{" "}
                <span className="font-semibold text-white underline decoration-emerald-500 underline-offset-4">
                    Trabajamos como un equipo profesional.
                </span>
            </p>
        </section>
    );
};

export default AgileRitualsSection;
