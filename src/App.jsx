import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Fleet from './pages/Fleet.jsx';
import Services from './pages/Services.jsx';
import Destinations from './pages/Destinations.jsx';
import FarePage from './pages/FarePage.jsx';
import Gallery from './pages/Gallery.jsx';
import Packages from './pages/Packages.jsx';
import Contact from './pages/Contact.jsx';
import Book from './pages/Book.jsx';
import NotFound from './pages/NotFound.jsx';
import PhotoCredits from './pages/PhotoCredits.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="services" element={<Services />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="fare-calculator" element={<FarePage />} />
        <Route path="packages" element={<Packages />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="contact" element={<Contact />} />
        <Route path="book" element={<Book />} />
        <Route path="photo-credits" element={<PhotoCredits />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
