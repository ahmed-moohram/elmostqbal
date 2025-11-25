import React, { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Tonsillitis Presentation Single-File React Component
// - TailwindCSS classes assumed available
// - Uses Framer Motion for animations and scroll-triggered effects
// - Images are hotlinked from Unsplash as explanatory visuals
// - Contains full medical content (definition, symptoms, causes, diagnosis, treatment, prevention)
// - Credits/group names included in an intro slide

export default function TonsillitisPresentation() {
  useEffect(() => window.scrollTo(0, 0), []);

  const sections = [
    {
      id: "hero",
      title: "Tonsillitis",
      subtitle: "Interactive Medical Presentation",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-[#0a0f1a] text-white",
      content: []
    },
    {
      id: "what",
      title: "What is Tonsillitis?",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-white text-black",
      content: [
        `Tonsillitis is an inflammatory condition affecting the tonsils, which are two small lymphatic glands located at the back of the throat. Inflammation occurs when these glands become infected by a viral or bacterial infection, leading to their swelling, redness, and severe pain during swallowing.`
      ]
    },
    {
      id: "symptoms",
      title: "Main Symptoms",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-gray-50 text-black",
      content: [
        "Sore Throat: Severe pain when swallowing and difficulty eating or drinking.",
        "Swelling and Redness: Tonsils appear visibly swollen and red.",
        "Fever and Chills: Body temperature may rise to 39°C or above.",
        "Additional Symptoms: Headache, fatigue, bad breath, and swollen lymph nodes in the neck."
      ]
    },
    {
      id: "causes",
      title: "Main Causes",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-white text-black",
      content: [
        "Viral Infection: Accounts for about 70–80% of cases. Common viruses include cold viruses, influenza, and other respiratory viruses.",
        "Bacterial Infection: Streptococcus pyogenes (Group A Streptococcus) is the primary bacterial cause. It can also lead to complications such as rheumatic fever."
      ]
    },
    {
      id: "diagnosis",
      title: "How is it Diagnosed?",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-gray-50 text-black",
      content: [
        `Clinical Examination: The doctor examines the throat for redness and swelling of the tonsils, as well as the presence of white or yellow patches. The neck is also checked for enlarged lymph nodes.`,
        `Throat Swab (Rapid Test or Culture): Rapid Test provides quick results; Culture offers more accurate confirmation (24–48 hours).`,
        `Complete Blood Count (CBC), Mononucleosis Test, and CT scan in severe/complicated cases.`
      ]
    },
    {
      id: "treatment",
      title: "Treatment",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-white text-black",
      content: [
        `Viral Cases: Rest, fluids, pain relievers, warm salt gargles.`,
        `Bacterial Cases: Antibiotics (Penicillin or Amoxicillin), complete the full course (7–10 days).`,
        `Surgical Intervention (Tonsillectomy): For recurrent or complicated cases, breathing difficulties, or abscess formation.`
      ]
    },
    {
      id: "prevention",
      title: "Prevention",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-gray-50 text-black",
      content: [
        "Wash hands regularly, avoid close contact with infected people, do not share utensils, maintain healthy sleep and nutrition." 
      ]
    },
    {
      id: "nursing",
      title: "Nursing Management",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-white text-black",
      content: [
        `Planning and organization, staff supervision, quality assurance, coordination, and problem solving. Nursing management improves patient care and hospital efficiency.`
      ]
    },
    {
      id: "summary",
      title: "Summary & Key Takeaways",
      img: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif",
      bg: "bg-gradient-to-br from-[#021124] via-[#06213a] to-[#0b3452] text-white",
      content: [
        `Tonsillitis is common and usually viral. Seek medical advice if symptoms last more than 5 days, fever is high, or there are breathing/swallowing difficulties.`
      ]
    }
  ];

  // small helper for animated entrance
  const Section = ({ s, reverse = false }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ threshold: 0.25 });

    useEffect(() => {
      if (inView) controls.start("visible");
    }, [controls, inView]);

    return (
      <section ref={ref} className={`min-h-screen flex items-center ${s.bg} py-20`}>
        <div className="container mx-auto px-6 lg:px-20">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
          >
            <div className={`lg:col-span-6 ${reverse ? "order-2 lg:order-1" : "order-1"}`}>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">{s.title}</h2>
              <div className="space-y-4 text-lg leading-relaxed">
                {s.content.map((p, i) => (
                  <motion.p key={i} whileHover={{ scale: 1.02 }}>
                    {p}
                  </motion.p>
                ))}
              </div>

              {/* small floating CTA */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="mt-8 inline-block bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl"
              >
                Learn more
              </motion.div>
            </div>

            <div className={`lg:col-span-6 flex justify-center ${reverse ? "order-1 lg:order-2" : "order-2"}`}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.9 }}
                className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-white"
              >
                <div className="relative">
                  <img src={s.img} alt={s.title} className="w-full h-72 object-cover" />
                  <div className="absolute -bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow">
                    <strong className="text-sm">Slide</strong>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  };

  return (
    <div className="w-full antialiased">
      {/* Floating navbar */}
      <nav className="fixed top-6 left-6 z-50">
        <div className="bg-white/10 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-white/5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">T</div>
            <div className="hidden sm:block">Tonsillitis — Interactive</div>
          </div>
        </div>
      </nav>

      {/* Hero with animated headline and group credit */}
      <header className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHgxeDV2bWltYTNqa2hjYm5oZTRrdmh3c2VmZ3lpMTEzcTljdzRxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UDU4cZ7QIYqzjXwFh2/giphy.gif')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center px-6"
        >
          <h1 className="text-6xl lg:text-8xl font-extrabold text-white tracking-tight mb-6">Tonsillitis</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">Professional interactive medical presentation — scroll to explore. Animated images explain each part of the content.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              'Sandy Mostafa','Ahmed Mamdouh','Aya Mohamed','Islam Moamen',
              'Omar Abdullah','Irene El Amir','Mohamed Hosny','Ahmed Moharam',
              'Abdel Kareem Saad','Rabea Mostafa','Mahmoud Mohamed','Abdel Azeem',
              'Hanaa Mahmoud','Fatma Mohamed'
            ].map((n, i) => (
              <motion.div key={n} whileHover={{ scale: 1.08 }} className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-white text-sm">
                {n}
              </motion.div>
            ))}
          </div>

          <motion.a href="#what" whileHover={{ scale: 1.03 }} className="inline-block mt-10 bg-white text-black px-6 py-3 rounded-full shadow-lg">
            Start Presentation
          </motion.a>

        </motion.div>

        {/* subtle animated floating shapes */}
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 8 }} className="absolute -bottom-10 right-10 opacity-60">
          <svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="white" strokeOpacity="0.08" strokeWidth="10" />
          </svg>
        </motion.div>
      </header>

      {/* Render sections with alternating layout */}
      {sections.slice(1).map((s, i) => (
        <Section key={s.id} s={s} reverse={i % 2 === 0} />
      ))}

      {/* Call to action + references */}
      <footer className="min-h-[60vh] flex items-center justify-center bg-[#071229] text-white py-24">
        <div className="max-w-4xl text-center px-6">
          <h3 className="text-3xl font-bold mb-6">References & Notes</h3>
          <p className="mb-6 leading-relaxed">Bailey & Love's Short Practice of Surgery (2022) • Harrison's Principles of Internal Medicine (2022) • CDC • WHO • Mayo Clinic • Cleveland Clinic</p>
          <div className="flex gap-4 justify-center">
            <a className="px-6 py-3 border rounded-lg border-white/20">Export as ZIP</a>
            <a className="px-6 py-3 border rounded-lg border-white/20">Download PPT</a>
            <a className="px-6 py-3 border rounded-lg border-white/20">Edit Content</a>
          </div>
          <p className="mt-10 text-sm text-white/70">© Interactive Medical Presentation — Generated for group project</p>
        </div>
      </footer>
    </div>
  );
}
