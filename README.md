<p align="center">
  <a href="https://getleon.ai"><img width="800" src="https://getleon.ai/img/hero-animation.gif" /></a>
</p>

<h1 align="center">
  <a href="https://getleon.ai"><img width="96" src="https://getleon.ai/img/logo.svg" alt="Leon"></a><br>
  Leon
</h1>

_<p align="center">Your open-source personal assistant.</p>_

<p align="center">
  <a href="https://github.com/leon-ai/leon/blob/develop/LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg?label=License&style=flat" /></a>
  <a href="https://github.com/leon-ai/leon/blob/develop/.github/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" /></a>
  <br>
  <a href="https://github.com/leon-ai/leon/actions/workflows/build.yml"><img src="https://github.com/leon-ai/leon/actions/workflows/build.yml/badge.svg?branch=develop" /></a>
  <a href="https://github.com/leon-ai/leon/actions/workflows/tests.yml"><img src="https://github.com/leon-ai/leon/actions/workflows/tests.yml/badge.svg?branch=develop" /></a>
  <a href="https://github.com/leon-ai/leon/actions/workflows/lint.yml"><img src="https://github.com/leon-ai/leon/actions/workflows/lint.yml/badge.svg?branch=develop" /></a>
  <br>
  <a href="https://discord.gg/MNQqqKg"><img src="https://svgshare.com/i/V09.svg"/></a>
</p>

<p align="center">
  <a href="https://getleon.ai">Website</a> ::
  <a href="https://docs.getleon.ai">Documentation</a> ::
  <a href="http://roadmap.getleon.ai">Roadmap</a> ::
  <a href="https://github.com/leon-ai/leon/blob/develop/.github/CONTRIBUTING.md">Contributing</a> ::
  <a href="https://blog.getleon.ai/the-story-behind-leon/">Story</a>
</p>

---

## Important Notice (as of 2024-06-18)

> [!IMPORTANT]
> Due to all the new major changes coming to Leon AI, the development branch might be unstable. It is recommended to use the older version under the master branch.
>
> Please note that older versions do not make use of any foundation model, which will be introduced in upcoming versions.

**Outdated Documentation**

Please note that the documentation and this README are not up to date. We've made significant changes to Leon over the past few months, including the introduction of new TTS and ASR engines, and a hybrid approach that balances LLM, simple classification, and multiple NLP techniques to achieve optimal speed, customization, and accuracy. We'll update the documentation for the official release.


## 👋 Introduction

**Leon** is an **open-source personal assistant** who can live **on your server**.

He **does stuff** when you **ask him to**.

You can **talk to him** and he can **talk to you**.
You can also **text him** and he can also **text you**.
If you want to, Leon can communicate with you by being **offline to protect your privacy**.

### Why?

> 1. If you are a developer (or not), you may want to build many things that could help in your daily life.
>    Instead of building a dedicated project for each of those ideas, Leon can help you with his
>    Skills structure.
> 2. With this generic structure, everyone can create their own skills and share them with others.
>    Therefore there is only one core (to rule them all).
> 3. Leon uses AI concepts, which is cool.
> 4. Privacy matters, you can configure Leon to talk with him offline. You can already text with him without any third party services.
> 5. Open source is great.

### What is this repository for?

> This repository contains the following nodes of Leon:
>
> - The server
> - Skills
> - The web app
> - The hotword node
> - The TCP server (for inter-process communication between Leon and third-party nodes such as spaCy)
> - The Python bridge (the connector between the core and skills made with Python)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16
- [npm](https://npmjs.com/) >= 8
- Supported OSes: Linux, macOS and Windows

To install these prerequisites, you can follow the [How To section](https://docs.getleon.ai/how-to/) of the documentation.

### Installation

```sh
# Install the Leon CLI
npm install --global @leon-ai/cli

# Install Leon (stable branch)
leon create birth
# OR install from the develop branch: leon create birth --develop
```

### Usage

```sh
# Check the setup went well
leon check

# Run
leon start

# Go to http://localhost:1337
# Hooray! Leon is running
```

## 📚 Documentation

For full documentation, visit [docs.getleon.ai](https://docs.getleon.ai).

## 📺 Video

[Watch a demo](https://www.youtube.com/watch?v=p7GRGiicO1c).

## 🧭 Roadmap

To know what is going on, follow [roadmap.getleon.ai](http://roadmap.getleon.ai).

## ❤️ Contributing

If you have an idea for improving Leon, do not hesitate.

**Leon needs open source to live**, the more skills he has, the more skillful he becomes.

## 📖 The Story Behind Leon

You'll find a write-up on this [blog post](https://blog.getleon.ai/the-story-behind-leon/).

## 🔔 Stay Tuned

- [Twitter](https://twitter.com/grenlouis)
- [Newsletter](https://newsletter.getleon.ai/subscription/form)
- [Blog](https://blog.getleon.ai)
- [GitHub issues](https://github.com/leon-ai/leon/issues)
- [YouTube](https://www.youtube.com/channel/UCW6mk6j6nQUzFYY97r47emQ)
- [#LeonAI](<https://twitter.com/search?f=live&q=%23LeonAI%20(from%3Agrenlouis%20OR%20from%3Alouistiti_fr)&src=typed_query>)

## 👨 Author

**Louis Grenard** ([@grenlouis](https://twitter.com/grenlouis))

## 👍 Sponsors

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle" width="128">
        <a href="https://github.com/Appwrite">
          <img src="https://github.com/Appwrite.png?size=128" />
          Appwrite
        </a><br>
        <sub><sup>250 USD / month</sup></sub>
      </td>
      <td align="center" valign="middle" width="128">
        <img src="https://getleon.ai/img/anonymous.svg" width="128" />
        Anonymous
        <br>
        <sub><sup>100 USD / month</sup></sub>
      </td>
      <td align="center" valign="middle" width="128">
        <a href="https://github.com/herbundkraut">
          <img src="https://github.com/herbundkraut.png?size=128" />
          herbundkraut
        </a><br>
        <sub><sup>10 USD / month</sup></sub>
      </td>
      <td align="center" valign="middle" width="128">
        <a href="http://sponsor.getleon.ai/">
          You?
        </a>
      </td>
    </tr>
  </tbody>
</table>

You can also contribute by [sponsoring Leon](http://sponsor.getleon.ai).

Please note that I dedicate most of my free time to Leon.

By sponsoring the project you make the project sustainable and faster to develop features.

The focus is not only limited to the activity you see on GitHub but also a lot of thinking about the direction of the project. Which is naturally related to the overall design, architecture, vision, learning process and so on...

### Special Thanks

<a href="https://vercel.com/?utm_source=leon-ai&utm_campaign=oss">
  <img src="https://i.imgur.com/S5olXWh.png" alt="Vercel" width="128" />
</a>
&nbsp; &nbsp; &nbsp;
<a href="https://www.macstadium.com/">
  <img src="https://getleon.ai/img/thanks/mac-stadium.svg" alt="MacStadium" width="128" />
</a>
&nbsp; &nbsp; &nbsp;
<a href="https://www.aoz.studio">
  <img src="https://getleon.ai/_next/image?url=%2Fimg%2Fthanks%2Faoz-studio.png&w=384&q=75" alt="AOZ Studio" width="128" />
</a>

## 📝 License

[MIT License](https://github.com/leon-ai/leon/blob/develop/LICENSE.md)

Copyright (c) 2019-present, Louis Grenard <louis@getleon.ai>

## Cheers!

![Cheers!](https://github.githubassets.com/images/icons/emoji/unicode/1f379.png 'Cheers!')
