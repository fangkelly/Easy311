import React, { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import logo from "./icons/logo.svg";

export default function Subscription() {
  const navigate = useNavigate();
  const [id, setId] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);

  useEffect(() => {
    const location = window.location;
    const queryParams = new URLSearchParams(location.search);
    let id;
    for (let pair of queryParams.entries()) {
      if (pair[0] === "id") {
        id = pair[1];
      }
    }
    setId(id);
  }, []);

  useEffect(() => {
    if (id) {
      getSubscriptions(id);
    }
  }, [id]);

  const getSubscriptions = (id) => {
    fetch(`/get_subscriptions?id=${id}`)
      .then((res) => {
        if (res) return res.json();
      })
      .then((d) => setSubscriptions(d));
  };

  const deleteSubscription = (encrypted, subType, subTo) => {
    const data = {
      encrypted: encrypted,
      subType: subType,
      subTo: subTo
    }
    fetch("/delete_subscription", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    .then((r) => {
      r.json();
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div
          id="App-header-logo-container"
          onClick={() => {
            navigate("/");
          }}
        >
          <img src={logo} className="App-logo" alt="logo" />
          <p>EASY 311</p>
        </div>
        <div id="App-header-settings-container">
          <p>EN</p>
          <FontAwesomeIcon
            icon={faCircleInfo}
            color={"#A1A1A1"}
            className={"fa-lg"}
          />
        </div>
      </header>
      <div id={"map-container"}>
        <div className="subscription-page">
          <p className="splash-heading">My Subscriptions</p>
          {subscriptions && (
            <>
              <div className="data-section">
                <p className={"data-title"}>Neighborhoods</p>
                <div className="sub-list">
                  {subscriptions.neighborhoods.map((n) => {
                    return (
                      <div>
                        <FontAwesomeIcon
                          icon={faXmark}
                          onClick={() => {
                            deleteSubscription(id, "neighborhoods", n);
                            let newNeigh = [
                              ...subscriptions.neighborhoods,
                            ].filter((d) => d !== n);
                            console.log(newNeigh);
                            setSubscriptions({
                              ...subscriptions,
                              neighborhoods: newNeigh,
                            });
                          }}
                        />{" "}
                        &nbsp;
                        <a
                          className="sub-link"
                          onClick={() => {
                            navigate(`/?neighborhood=${n}`);
                          }}
                        >
                          {n}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="data-section">
                <p className={"data-title"}>Service Requests</p>
                <div className="sub-list">
                  {subscriptions.requests.map((r) => {
                    return (
                      <div>
                        <FontAwesomeIcon
                          icon={faXmark}
                          onClick={() => {
                            deleteSubscription(id, "requests", r);
                            // let newReqs = [...subscriptions.requests].filter(
                            //   (d) => d !== r
                            // );
                            // console.log(newReqs);
                            // setSubscriptions({
                            //   ...subscriptions,
                            //   requests: newReqs,
                            // });
                          }}
                        />{" "}
                        &nbsp;
                        <a
                          className="sub-link"
                          onClick={() => {
                            navigate(`/?req=${r}`);
                          }}
                        >
                          {r}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
