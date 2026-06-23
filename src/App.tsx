import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Map from "./components/Map";
import { useMapStore } from "./store/mapStore";

const App = () => {
  const { zoomTo } = useMapStore();

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="flex-grow relative">
        <Map zoomTo={zoomTo} />
      </div>
    </div>
  );
};

export default App;
