import { Link } from "react-router-dom";
import Button from "../components/UI/Button";
import landingImage from "../assets/landing_img.png";

const HomePage = () => {
  return (
    <div
      className="bg-gradient-to-b from-blue-50 to-white min-h-screen"
      id="home"
    >
      <div className="overflow-clip pt-28 xl:pt-0 xl:flex xl:items-center xl:min-h-screen">
        <div className="mx-auto grid grid-cols-12 items-center gap-2 md:gap-16 md:px-10 xl:w-[1280px] xl:px-2">
          <div className="col-span-12 px-4 md:col-span-7 md:px-0">
            <h1 className="mb-8 break-words text-5xl font-bold tracking-[-0.02em] lg:leading-tight lg:text-7xl bg-gradient-to-r from-blue-400 to-purple-800 bg-clip-text text-transparent animate-fadeInUp">
              Gibs Retail Broker's Insurance Portal
            </h1>
            <div
              className="mb-10 text-lg font-light text-gray-700 lg:text-3xl animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              <p>
                <strong>
                  Flexible and responsive insurance services using cutting-edge
                  digital platform.
                </strong>
              </p>
            </div>
            <div className="flex items-start gap-4">
              <Button
                asLink
                to="/login"
                data-discover="true"
                className="min-w-[300px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Login
              </Button>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <figure className="md:-mr-30">
              {/* Replace this placeholder with your actual landing image */}
              <img
                alt="Enterprise Solutions"
                className="w-full"
                sizes="100vw"
                loading="lazy"
                decoding="async"
                src={landingImage}
              />
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
