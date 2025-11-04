import { Link } from "react-router-dom";
import Button from "../components/UI/Button";
// import landingImage from "../assets/landing_img.png";

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
              {/* <img
                alt="Enterprise Solutions"
                className="w-full"
                sizes="100vw"
                loading="lazy"
                decoding="async"
                src={landingImage}
              /> */}
              <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-xl">
                <div className="text-center p-8">
                  <svg
                    className="w-48 h-48 mx-auto text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-gray-600 mt-4">
                    Add your landing image here
                  </p>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
