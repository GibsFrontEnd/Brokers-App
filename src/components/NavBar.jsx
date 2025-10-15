import { Link } from "react-router-dom";
import { IoIosContact } from "react-icons/io";
import { MdGroups } from "react-icons/md";
import { BsFillBuildingsFill } from "react-icons/bs";
import { useLocation } from "react-router-dom"

export default function NavBar() {

    const { pathname } = useLocation();

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">GIBSLIFE BROKERS PORTAL</h1>
      
    </nav>
  );
}
