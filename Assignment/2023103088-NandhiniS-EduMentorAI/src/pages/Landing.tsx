import { Link } from "react-router-dom";
const f = ["PDF Learning", "AI Quiz Generation", "AI Assessment", "Personalized Study Plans"];
export default function Landing() {
  return (<div className="mx-auto max-w-5xl px-6 py-20">
    <h1 className="up text-5xl font-extrabold md:text-6xl">Learn Smarter with <span className="text-primary">Multi-Agent AI</span></h1>
    <p className="text-muted mt-4 text-xl">Upload PDFs. Generate Quizzes. Assess Knowledge. Improve Learning.</p>
    <div className="mt-8 flex gap-3"><Link to="/login?mode=signup" className="btn">Get Started</Link><Link to="/login" className="btn bg-alt text-white">Login</Link></div>
    <ul className="mt-14 grid gap-4 sm:grid-cols-2">{f.map(x => <li key={x} className="card scale-in font-semibold">{x}</li>)}</ul></div>);
}
