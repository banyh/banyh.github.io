import React from "react"
import * as FontAwesome from "react-icons/fa"
import * as Ionicons from "react-icons/io"
import * as MaterialDesign from "react-icons/md"
import * as Typicons from "react-icons/ti"
import * as GithubOcticons from "react-icons/go"
import * as Feather from "react-icons/fi"
import * as GameIcons from "react-icons/gi"
import * as WeatherIcons from "react-icons/wi"
import * as Devicons from "react-icons/di"

import "./tags.css"
import { Link } from "gatsby";

const TechTag = (props) => {
    const { tag, tech, name, size, color } = props
    const str = name;
    const icon = /^Fa/.test(str) ? React.createElement(FontAwesome[name]) :
                 /^Io/.test(str) ? React.createElement(Ionicons[name]) :
                 /^Md/.test(str) ? React.createElement(MaterialDesign[name]) :
                 /^Ti/.test(str) ? React.createElement(Typicons[name]) :
                 /^Go/.test(str) ? React.createElement(GithubOcticons[name]) :
                 /^Fi/.test(str) ? React.createElement(Feather[name]) :
                 /^Gi/.test(str) ? React.createElement(GameIcons[name]) :
                 /^Wi/.test(str) ? React.createElement(WeatherIcons[name]) :
                 React.createElement(Devicons[name]);

    return (
        <div className="d-inline-block p-1">
            <Link to={`/tags/${tag}/`}>
                <button
                    className="tech-tag text-white">
                    <p className="d-inline">{tech} </p>
                    <div className="d-inline" style={{ fontSize: size, color: color }}>{icon}</div>
                </button>
            </Link>

        </div>

    )
}

export default TechTag