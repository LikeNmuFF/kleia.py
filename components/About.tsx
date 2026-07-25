'use client'

import { motion } from 'framer-motion'

const skills = [
  { name: 'Python', level: 70 },
  { name: 'Bash', level: 45 },
  { name: 'CTF Basics', level: 40 },
  { name: 'Linux', level: 55 },
  { name: 'Git', level: 50 },
  { name: 'HTML/CSS', level: 35 },
]

export default function About() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-python-yellow">$</span> cat about.md
          </h2>
          <div className="w-24 h-1 bg-python-blue mb-8" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-300 leading-relaxed mb-4 font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> CS student
              passionate about cybersecurity and automation.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4 font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> Currently
              pursuing BaSC in Computer Science while diving deep into Python
              and CTF challenges.
            </p>
            <p className="text-gray-300 leading-relaxed font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> Building in
              public — documenting every bug, every fix, every &quot;aha!&quot;
              moment along the way.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-mono font-semibold mb-6 text-python-blue">
              {'// skills.map()'}
            </h3>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                  className="group"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-sm text-gray-300 group-hover:text-python-yellow transition-colors">
                      {skill.name}
                    </span>
                    <span className="font-mono text-xs text-python-blue">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-2 bg-python-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + 0.1 * index }}
                      className="h-full bg-gradient-to-r from-python-blue to-python-yellow rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
