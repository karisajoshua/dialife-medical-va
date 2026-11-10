import Link from "next/link";
import { ArrowRight, HeartPulse, GraduationCap, Stethoscope } from "lucide-react";

export default function FounderStory({ compact = false }: { compact?: boolean }) {
  return <section className={compact ? "founder-story founder-compact container" : "founder-story founder-full"} aria-labelledby={compact ? "founder-home-title" : "founder-about-title"}>
    <div className="founder-portrait-placeholder" aria-label="Founder portrait will be added soon">
      <div className="founder-monogram" aria-hidden="true">ST</div>
      <span>FOUNDER · DIALIFE MEDICAL VA</span>
      <small>Portrait coming soon</small>
    </div>
    <div className="founder-narrative">
      <span className="content-kicker">THE EXPERIENCE BEHIND DIALIFE</span>
      <h2 id={compact ? "founder-home-title" : "founder-about-title"}>Healthcare is more than a profession. <em>It is where our story begins.</em></h2>
      <p>Before Dialife Medical VA, there were years spent in healthcare settings where patient needs, busy clinical teams and the daily demands of delivering care came together. That experience belongs to our founder, <strong>Sarah Wangui Tumuti</strong>.</p>
      <p>Trained in Clinical Medicine and Surgery at Kenya Medical Training College and Health Systems Management at Kenya Methodist University, Sarah brings experience across outpatient and emergency care, community healthcare, health facility leadership and professional training.</p>
      {compact ? <p>Her journey gives Dialife its purpose: helping healthcare-trained Africans carry their knowledge into remote medical administration, while supporting healthcare teams that need capable, professional assistance.</p> : <>
        <p>Working in healthcare means understanding what happens behind every appointment, follow-up and patient conversation. It means recognizing how administrative details can affect the experience of both patients and care providers.</p>
        <p>Sarah's work in maternal and child health training, including her involvement with Vitamin Angels, also reflects the importance of clear communication, practical learning and professional responsibility.</p>
        <p><strong>Dialife Medical VA grows from that intersection of clinical understanding and opportunity.</strong> We prepare people with healthcare backgrounds to develop the digital, communication and administrative skills used in remote medical support. Our four-week online academy combines structured learning with fictional patient-call simulations, scheduling exercises, privacy awareness and practical assessment.</p>
        <p>For aspiring medical virtual assistants, this is a way to build on existing knowledge rather than leave it behind. For healthcare employers, it is an approach to talent preparation informed by experience of how healthcare teams work.</p>
      </>}
      <div className="founder-credentials"><span><Stethoscope size={18}/> Clinical Medicine & Surgery</span><span><HeartPulse size={18}/> Health Systems Management</span><span><GraduationCap size={18}/> Healthcare Training</span></div>
      <div className="founder-actions"><Link href={compact ? "/about" : "/academy"} className="button dark">{compact ? "Meet Our Founder" : "Explore the Academy"} <ArrowRight size={17}/></Link>{!compact && <Link href="/employers" className="founder-text-link">For healthcare employers <ArrowRight size={17}/></Link>}</div>
      <p className="founder-signature"><strong>Sarah Wangui Tumuti</strong><span>Founder, Dialife Medical VA</span></p>
    </div>
  </section>;
}
