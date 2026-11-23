import { Link } from 'react-router-dom';
import { PageHero, Seo, btn } from '../components/UI.jsx';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" path="/404" description="The page you are looking for could not be found." />
      <PageHero title="Looks like we took a wrong turn" text="The page you are looking for does not exist." crumb="404" />
      <section className="container-x py-20 text-center">
        <Link to="/" className={btn.gold}>Back to home</Link>
      </section>
    </>
  );
}
