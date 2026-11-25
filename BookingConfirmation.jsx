import { PageHero, Seo } from '../components/UI.jsx';
import ConfirmationPage from '../booking/ConfirmationPage';

export default function BookingConfirmation() {
  return (
    <>
      <Seo title="Booking Confirmation" path="/book/confirmation" description="Your Narayan Tours & Travels booking details." />
      <PageHero title="Booking Confirmation" crumb="Booking Confirmation" />
      <div className="container-x py-10 sm:py-14">
        <ConfirmationPage />
      </div>
    </>
  );
}
