<div id="top"></div>

<!-- PROJECT SHIELDS -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links-->
<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![Wiki][wiki-shield]][wiki-url]

</div>

<!-- PROJECT LOGO -->
<br />
<!-- UPDATE -->
<div align="center">
  <a href="https://github.com/metakgp/cfmn">
     <img width="140" alt="image" src="https://raw.githubusercontent.com/metakgp/design/main/logos/black-large.jpg">
  </a>

<h3 align="center">CFMN: Can't Find My Notes</h3>

  <p align="center">
  <!-- UPDATE -->
    <i>No more venturing into dark alleys</i>
    <br />
    <a href="https://notes.metakgp.org">Website</a>
    ·
    <a href="https://github.com/metakgp/cfmn/issues">Request Feature / Report Bug</a>
  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
<summary>Table of Contents</summary>

- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Google OAuth Setup](#google-oauth-setup)
  - [Installation](#installation)
- [Usage](#usage)
- [Contact](#contact)
  - [Maintainer(s)](#maintainers)
  - [creators(s)](#creators)
- [Additional documentation](#additional-documentation)

</details>


<!-- ABOUT THE PROJECT -->
## About The Project
[WIP]


## Getting Started
[WIP]


### Prerequisites
[WIP]

### Google OAuth Setup

This project requires Google OAuth for authentication. You need to set up a Google OAuth client and configure the client ID in multiple environment files.

#### Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
  - Choose **External** user type
  - Fill in the required fields (App name, User support email, Developer contact email)
  - Add your domain to **Authorized domains** if deploying to production
6. For **Application type**, select **Web application**
7. Add your Authorized Javascript origins:
  - For development: `http://localhost:5173` and `http://localhost`
  - For production: `https://cfmn.metakgp.org` (frontend URL)
8. Click **Create** and copy the **Client ID**

#### Step 2: Configure Environment Variables

You need to set the Google Client ID in the following environment files:

**Frontend Environment Files:**
- `frontend/.env.local` (for development)
- `frontend/.env.production` (for production builds)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Root Environment Files:**
- `root/.env` (for development)
- `root/.production.env` (for production)

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### Step 3: Verify Configuration

Make sure all four files contain the correct Google Client ID:
- Frontend uses `VITE_GOOGLE_CLIENT_ID` (Vite environment variable)
- Backend/root uses `GOOGLE_CLIENT_ID` (standard environment variable)

### Installation

[WIP]


<!-- USAGE EXAMPLES -->
## Usage
[WIP]

## Contact

<p>
📫 Metakgp -
<a href="https://slack.metakgp.org">
  <img align="center" alt="Metakgp's slack invite" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/slack.svg" />
</a>
<a href="mailto:metakgp@gmail.com">
  <img align="center" alt="Metakgp's email " width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/gmail.svg" />
</a>
<a href="https://www.facebook.com/metakgp">
  <img align="center" alt="metakgp's Facebook" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/facebook.svg" />
</a>
<a href="https://www.linkedin.com/company/metakgp-org/">
  <img align="center" alt="metakgp's LinkedIn" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/linkedin.svg" />
</a>
<a href="https://twitter.com/metakgp">
  <img align="center" alt="metakgp's Twitter " width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/twitter.svg" />
</a>
<a href="https://www.instagram.com/metakgp_/">
  <img align="center" alt="metakgp's Instagram" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/instagram.svg" />
</a>
</p>

### Maintainer(s)

The currently active maintainer(s) of this project.

<!-- UPDATE -->
- [Devansh Gupta](https://github.com/Devansh-bit)

### Creator(s)

Honoring the original creator(s) and ideator(s) of this project.

<!-- UPDATE -->
- [Devansh Gupta](https://github.com/Devansh-bit)

<p align="right">(<a href="#top">back to top</a>)</p>

## Additional documentation

- [License](/LICENSE)
- [Code of Conduct](/.github/CODE_OF_CONDUCT.md)
- [Security Policy](/.github/SECURITY.md)
- [Contribution Guidelines](/.github/CONTRIBUTING.md)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[contributors-shield]: https://img.shields.io/github/contributors/metakgp/cfmn.svg?style=for-the-badge
[contributors-url]: https://github.com/metakgp/cfmn/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/metakgp/cfmn.svg?style=for-the-badge
[forks-url]: https://github.com/metakgp/cfmn/network/members
[stars-shield]: https://img.shields.io/github/stars/metakgp/cfmn.svg?style=for-the-badge
[stars-url]: https://github.com/metakgp/cfmn/stargazers
[issues-shield]: https://img.shields.io/github/issues/metakgp/cfmn.svg?style=for-the-badge
[issues-url]: https://github.com/metakgp/cfmn/issues
[license-shield]: https://img.shields.io/github/license/metakgp/cfmn.svg?style=for-the-badge
[license-url]: https://github.com/metakgp/cfmn/blob/master/LICENSE
[wiki-shield]: https://custom-icon-badges.demolab.com/badge/metakgp_wiki-grey?logo=metakgp_logo&style=for-the-badge
[wiki-url]: https://wiki.metakgp.org