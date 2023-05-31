import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Puff } from "react-loader-spinner";
import { connectAndCall } from "../helpers/test-call";

const HeaderBar = () => {
  const [inputValue, setInputValue] = useState("");
  const [btnText, setBtnText] = useState("Test Transaction");
  const routeParams = useParams();
  const [searchParams] = useSearchParams();
  const [isLoader, setLoader] = useState(false)

  useEffect(() => {
    if (routeParams.id) {
      setInputValue(routeParams.id);
      setBtnText("Mint as Video NFT");
    }

    if(searchParams.get("isVideo")){
      setLoader(true)
    }
  }, []);
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const onSearch = () => {
    window.location.replace(`/${inputValue}`);
  };

  return (
    <div className="absolute top-30 w-full flex">
      <div className="flex-1 ">
        <div className="absolute ">
          <div className="m-2 rounded-full px-4 p-3 inset-0 bg-black opacity-80 backdrop-filter backdrop-blur-md">
            <img height={72} width={72} src="/logo.png" />
          </div>
        </div>
      </div>
      <div className="transform rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 w-1/3 flex p-2 mt-3">
        <button
          onClick={async () => {
            if (routeParams.id) {
              window.location.replace(`/${inputValue}?isVideo=true`);
            } else {
              // test transaction
              setLoader(true)
              await connectAndCall()
              setLoader(false)
            }
          }}
          className="rounded-l-md bg-orange-500 text-white px-4 py-2 h-30 hover:bg-orange-600 focus:outline-none active:bg-orange-700 transition-all duration-100 ease-in-out"
        >
          {isLoader ? (
            <Puff
              height="24"
              width="24"
              radius={1}
              color="#ffffff"
              ariaLabel="puff-loading"
              visible={true}
            />
          ) : (
            btnText
          )}
        </button>
        <div className="flex-1 bg-gray-800 rounded-r-md flex items-center ml-10p">
          <div className="relative flex-1">
            <input
              value={inputValue}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
              onChange={handleInputChange}
              type="text"
              placeholder="Transaction Hash"
              className="w-full pl-4 pr-12 py-2 text-white bg-transparent focus:outline-none rounded-r-md mr-2"
            />
            <button
              onClick={onSearch}
              className="p-1.5 absolute flex items-center justify-center right-0 top-1/2 transform -translate-y-1/2 bg-orange-500 w-8 h-8 rounded-full mx-2 hover:bg-orange-600 focus:outline-none active:bg-orange-700 transition-all duration-100 ease-in-out"
            >
              <svg
                version="1.1"
                id="Layer_1"
                x="0px"
                y="0px"
                viewBox="0 0 122.879 119.799"
                fill="white"
              >
                <g>
                  <path d="M49.988,0h0.016v0.007C63.803,0.011,76.298,5.608,85.34,14.652c9.027,9.031,14.619,21.515,14.628,35.303h0.007v0.033v0.04 h-0.007c-0.005,5.557-0.917,10.905-2.594,15.892c-0.281,0.837-0.575,1.641-0.877,2.409v0.007c-1.446,3.66-3.315,7.12-5.547,10.307 l29.082,26.139l0.018,0.016l0.157,0.146l0.011,0.011c1.642,1.563,2.536,3.656,2.649,5.78c0.11,2.1-0.543,4.248-1.979,5.971 l-0.011,0.016l-0.175,0.203l-0.035,0.035l-0.146,0.16l-0.016,0.021c-1.565,1.642-3.654,2.534-5.78,2.646 c-2.097,0.111-4.247-0.54-5.971-1.978l-0.015-0.011l-0.204-0.175l-0.029-0.024L78.761,90.865c-0.88,0.62-1.778,1.209-2.687,1.765 c-1.233,0.755-2.51,1.466-3.813,2.115c-6.699,3.342-14.269,5.222-22.272,5.222v0.007h-0.016v-0.007 c-13.799-0.004-26.296-5.601-35.338-14.645C5.605,76.291,0.016,63.805,0.007,50.021H0v-0.033v-0.016h0.007 c0.004-13.799,5.601-26.296,14.645-35.338C23.683,5.608,36.167,0.016,49.955,0.007V0H49.988L49.988,0z M50.004,11.21v0.007h-0.016 h-0.033V11.21c-10.686,0.007-20.372,4.35-27.384,11.359C15.56,29.578,11.213,39.274,11.21,49.973h0.007v0.016v0.033H11.21 c0.007,10.686,4.347,20.367,11.359,27.381c7.009,7.012,16.705,11.359,27.403,11.361v-0.007h0.016h0.033v0.007 c10.686-0.007,20.368-4.348,27.382-11.359c7.011-7.009,11.358-16.702,11.36-27.4h-0.006v-0.016v-0.033h0.006 c-0.006-10.686-4.35-20.372-11.358-27.384C70.396,15.56,60.703,11.213,50.004,11.21L50.004,11.21z" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex pr-3 justify-end items-center">
        <button className="flex justify-center items-center rounded-md px-3 py-2  bg-orange-500 text-white mt-3 h-30 hover:bg-orange-600 focus:outline-none active:bg-orange-700 transition-all duration-100 ease-in-out">
          <div className="mr-2">
            <svg
              fill="#FFFFFF"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="32px"
              height="32px"
            >
              {" "}
              <path d="M17.791,46.836C18.502,46.53,19,45.823,19,45v-5.4c0-0.197,0.016-0.402,0.041-0.61C19.027,38.994,19.014,38.997,19,39 c0,0-3,0-3.6,0c-1.5,0-2.8-0.6-3.4-1.8c-0.7-1.3-1-3.5-2.8-4.7C8.9,32.3,9.1,32,9.7,32c0.6,0.1,1.9,0.9,2.7,2c0.9,1.1,1.8,2,3.4,2 c2.487,0,3.82-0.125,4.622-0.555C21.356,34.056,22.649,33,24,33v-0.025c-5.668-0.182-9.289-2.066-10.975-4.975 c-3.665,0.042-6.856,0.405-8.677,0.707c-0.058-0.327-0.108-0.656-0.151-0.987c1.797-0.296,4.843-0.647,8.345-0.714 c-0.112-0.276-0.209-0.559-0.291-0.849c-3.511-0.178-6.541-0.039-8.187,0.097c-0.02-0.332-0.047-0.663-0.051-0.999 c1.649-0.135,4.597-0.27,8.018-0.111c-0.079-0.5-0.13-1.011-0.13-1.543c0-1.7,0.6-3.5,1.7-5c-0.5-1.7-1.2-5.3,0.2-6.6 c2.7,0,4.6,1.3,5.5,2.1C21,13.4,22.9,13,25,13s4,0.4,5.6,1.1c0.9-0.8,2.8-2.1,5.5-2.1c1.5,1.4,0.7,5,0.2,6.6c1.1,1.5,1.7,3.2,1.6,5 c0,0.484-0.045,0.951-0.11,1.409c3.499-0.172,6.527-0.034,8.204,0.102c-0.002,0.337-0.033,0.666-0.051,0.999 c-1.671-0.138-4.775-0.28-8.359-0.089c-0.089,0.336-0.197,0.663-0.325,0.98c3.546,0.046,6.665,0.389,8.548,0.689 c-0.043,0.332-0.093,0.661-0.151,0.987c-1.912-0.306-5.171-0.664-8.879-0.682C35.112,30.873,31.557,32.75,26,32.969V33 c2.6,0,5,3.9,5,6.6V45c0,0.823,0.498,1.53,1.209,1.836C41.37,43.804,48,35.164,48,25C48,12.318,37.683,2,25,2S2,12.318,2,25 C2,35.164,8.63,43.804,17.791,46.836z" />
            </svg>
          </div>
          Sdk/ Docs
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
