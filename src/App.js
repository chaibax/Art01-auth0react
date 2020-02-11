import React from "react";
import { useAuth0 } from "./react-auth0-wrapper";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Profile from "./components/Profile";
import Paint from "./components/Paint";
import Start from "./components/Start";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./components/Home";
import NavBar from "./components/NavBar";
import './App.sass';
import './App.css';

function App() {

    const { loading } = useAuth0();

    if (loading) {
        return (
            <div className="pageloader is-active shadowed blackbackground">
                <span className="title">Loading Art01 App.js</span>
            </div>
        );
    }

    const NoMatch = () => (
        <h1 className="title is-size-1 has-text-centered shadowed">
            Error 404<br />page not found :(
              <br />
            <br />
            <a href="/" style={{ textDeconration: 'none', color: '#f0fff8' }}> >> go to home page</a>
        </h1>
    )

    return (
        <div className="App">
            <section className="hero fullheight">
                <div className="hero-body">
                    <div className="columns is-centered">
                        <div className="container">
                            <BrowserRouter>
                                <Switch>
                                    <Route path="/" exact="exact" component={Home} />
                                    <Route path="/start" exact="exact" component={Start} />
                                    <PrivateRoute path="/profile" component={Profile} />
                                    <PrivateRoute path="/paint" >
                                        <NavBar />
                                        <Paint />
                                    </PrivateRoute>
                                    <Route component={NoMatch} />
                                </Switch>
                            </BrowserRouter>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default App;
