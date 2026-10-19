/**
 * Setting up a new computer for the Brat Academy courses, on a Mac or on
 * Windows, from bratcode-brainbook's NEWCOMPUTERDEVSETUP guides. The syllabus
 * at Brat Academy (SchoolSyllabus.tsx) shows them step by step, each with its
 * commands to copy. The cute terminal and the first commit are Brat Academy's
 * own, on top of the guides.
 */

export interface Step {
  title: string;
  /** a line or two about the step, before the commands */
  note?: string;
  /** each block is pasted into the terminal as one */
  code: string[];
  /** a line or two after the commands */
  after?: string;
  link?: { text: string; href: string };
}

export interface Guide {
  id: "mac" | "windows";
  name: string;
  blurb: string;
  href: string;
  steps: Step[];
}

const SSH_KEY_TIP =
  "Paste the whole key into GitHub as it comes, from ssh-ed25519 to your email: no line breaks or quotes. The title can be anything, like SSH_KEY_MacBook.";

export const GUIDES: Guide[] = [
  {
    id: "mac",
    name: "Mac",
    blurb: "A new Mac set up for full-stack, blockchain, iOS and AI: React, Node, Solidity, Python, Swift, Go, Rust, Scala and more.",
    href: "https://github.com/mollybeach/bratcode-brainbook/blob/master/NEWCOMPUTERDEVSETUP/newMacBookSetUpDeveloperGuide.md",
    steps: [
      {
        title: "Xcode tools & Homebrew",
        code: [
          'xcode-select --install\n/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
          "echo 'eval \"$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile\neval \"$(/opt/homebrew/bin/brew shellenv)\"",
          "brew doctor\nbrew --version",
        ],
        note: "Install the command line tools and Homebrew, put Homebrew on your path, then check it.",
      },
      {
        title: "Core tools",
        code: [
          "brew install git node yarn python scala java sbt r ruby\nbrew install postgresql mongodb redis\nbrew install docker kubectl terraform\nbrew install jq wget tree gh tmux fzf bat\nbrew install nvm pyenv pipx\nbrew install --cask anaconda",
        ],
      },
      {
        title: "Git configuration",
        note: "Your name and email go on every commit. Keep the double quotes.",
        code: [
          'git config --global user.name "myGitHubUserName"\ngit config --global user.email "myEmail@example.com"',
          'git config --global url."git@github.com:".insteadOf "https://github.com/"',
        ],
        after: "The second line makes Git use SSH instead of HTTPS with GitHub.",
      },
      {
        title: "GitHub SSH key",
        note: "Makes a key, starts the SSH agent and keeps the key in your keychain. Use your own GitHub email, in quotes, and press Enter at every prompt.",
        code: [
          'ssh-keygen -t ed25519 -C "youremail@example.com" && \\\neval "$(ssh-agent -s)" && \\\necho "Host *" >> ~/.ssh/config && \\\necho "  AddKeysToAgent yes" >> ~/.ssh/config && \\\necho "  UseKeychain yes" >> ~/.ssh/config && \\\necho "  IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config && \\\nssh-add --apple-use-keychain ~/.ssh/id_ed25519',
          "pbcopy < ~/.ssh/id_ed25519.pub",
          "ssh -T git@github.com",
        ],
        after: `${SSH_KEY_TIP} Then test it: type yes the first time, and look for "You've successfully authenticated".`,
        link: { text: "Add the key on GitHub", href: "https://github.com/settings/ssh/new" },
      },
      {
        title: "Go",
        code: [
          "brew install go",
          "echo 'export PATH=\"/opt/homebrew/opt/go/libexec/bin:$PATH\"' >> ~/.zprofile\nsource ~/.zprofile",
          "go version",
        ],
      },
      {
        title: "Rust",
        note: "Press Enter for the default install (and y if it asks about an existing one).",
        code: [
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
          "echo 'source \"$HOME/.cargo/env\"' >> ~/.zprofile\nsource ~/.zprofile",
          "rustc --version\ncargo --version",
          "rustup component add clippy rustfmt rust-analyzer\nbrew install wasm-pack",
        ],
        after: 'If cargo still isn\'t found, run . "$HOME/.cargo/env" once.',
      },
      {
        title: "Python",
        code: [
          "brew install python",
          "sudo ln -s $(which pip3) /opt/homebrew/bin/pip",
          "python3 --version\npip3 --version",
          "pip3 install --break-system-packages -r requirements.txt",
        ],
        note: "Python 3 and pip3 from Homebrew; the link makes plain pip work too.",
      },
      {
        title: "Apps for Launchpad",
        note: "Open each one once afterwards so macOS can ask for its permissions.",
        code: [
          "brew install --cask xcode",
          "brew install --cask visual-studio-code cursor github\nbrew install --cask docker postgres-unofficial insomnia warp\nbrew install --cask google-chrome firefox arc\nbrew install --cask figma kap",
        ],
      },
      {
        title: "Blockchain / Web3",
        code: [
          "npm install -g hardhat truffle ganache\nbrew tap foundry-rs/foundry && brew install foundry\nbrew install solidity\nbrew install aptos solana\nbrew install ipfs",
        ],
      },
      {
        title: "Cloud: AWS, GCP, Azure, Firebase",
        code: [
          "brew install awscli\naws configure\naws sts get-caller-identity",
          "brew install --cask google-cloud-sdk\ngcloud init\ngcloud auth login",
          "brew install azure-cli\naz login",
          "npm install -g firebase-tools\nfirebase login\nfirebase init",
        ],
      },
      {
        title: "Make your terminal cute ✨",
        note: "Brat Academy extra: a prompt that shows your Git branch, and a font made for code.",
        code: [
          "brew install starship\necho 'eval \"$(starship init zsh)\"' >> ~/.zshrc\nsource ~/.zshrc",
          "brew install --cask font-fira-code",
        ],
        after: "Then pick Fira Code as the font in your terminal and in VS Code (Settings → Font Family), and choose a theme you love.",
      },
      {
        title: "Your first commit 🎀",
        note: "Brat Academy extra: start the repo every project on the path goes into.",
        code: [
          'mkdir brat-academy && cd brat-academy\ngit init\necho "# Brat Academy 💅" > README.md\ngit add README.md\ngit commit -m "First day at Brat Academy"',
          "gh auth login\ngh repo create brat-academy --public --source=. --push",
        ],
        after: "Open github.com/<your username>/brat-academy: that's your first commit, live.",
      },
      {
        title: "Clone a project",
        code: ["git clone git@github.com:myGitHubUserName/myProjectName.git\ncd myProjectName\nmake install-deps"],
        after: "VS Code extensions worth adding: Rust Analyzer, ESLint + Prettier, GitHub Copilot, Solidity, Python, Docker, GraphQL.",
      },
    ],
  },
  {
    id: "windows",
    name: "Windows",
    blurb: "A Windows 11 machine set up for full-stack, blockchain, AI and cross-platform work, with Linux alongside through WSL.",
    href: "https://github.com/mollybeach/bratcode-brainbook/blob/master/NEWCOMPUTERDEVSETUP/setUpNewWindowsComputer.md",
    steps: [
      {
        title: "Windows Subsystem for Linux",
        note: "In PowerShell, run as Administrator. It installs Ubuntu; type wsl afterwards for a Linux shell.",
        code: ["wsl --install"],
      },
      {
        title: "winget",
        note: "Windows 11 comes with it. If this fails, update Windows or get App Installer from the Microsoft Store.",
        code: ["winget --version"],
      },
      {
        title: "Core tools",
        note: "In PowerShell (Admin).",
        code: [
          "winget install -e --id Git.Git\nwinget install -e --id OpenJS.NodeJS.LTS\nwinget install -e --id Yarn.Yarn\nwinget install -e --id Python.Python.3\nwinget install -e --id EclipseAdoptium.Temurin.17.JDK\nwinget install -e --id SBT.SBT\nwinget install -e --id MongoDB.MongoDBCompass\nwinget install -e --id Redis.Redis\nwinget install -e --id PostgreSQL.PostgreSQL\nwinget install -e --id Docker.DockerDesktop\nwinget install -e --id Hashicorp.Terraform\nwinget install -e --id Rustlang.Rustup\nwinget install -e --id GoLang.Go\nwinget install -e --id Microsoft.WindowsTerminal",
        ],
      },
      {
        title: "Git configuration",
        note: "Your name and email go on every commit. Keep the double quotes.",
        code: [
          'git config --global user.name "yourGitHubUsername"\ngit config --global user.email "youremail@example.com"\ngit config --global url."git@github.com:".insteadOf "https://github.com/"',
        ],
        after: "The last line makes Git use SSH instead of HTTPS with GitHub.",
      },
      {
        title: "GitHub SSH key",
        note: "In Git Bash or Ubuntu (WSL). Use your own GitHub email, in quotes, and press Enter at every prompt.",
        code: ['ssh-keygen -t ed25519 -C "youremail@example.com"\neval "$(ssh-agent -s)"\nssh-add ~/.ssh/id_ed25519', "cat ~/.ssh/id_ed25519.pub | clip.exe"],
        after: SSH_KEY_TIP,
        link: { text: "Add the key on GitHub", href: "https://github.com/settings/ssh/new" },
      },
      {
        title: "Rust",
        code: ["rustup install stable\nrustup component add clippy rustfmt rust-analyzer", "rustc --version\ncargo --version"],
      },
      {
        title: "Python, with pyenv in WSL",
        code: [
          "curl https://pyenv.run | bash",
          'export PATH="$HOME/.pyenv/bin:$PATH"\neval "$(pyenv init --path)"\neval "$(pyenv virtualenv-init -)"',
          "source ~/.bashrc\npyenv install 3.12.2\npyenv global 3.12.2",
        ],
        note: "The three lines in the middle go at the end of ~/.bashrc.",
      },
      {
        title: "Node with nvm, in WSL",
        code: ["curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\nsource ~/.bashrc\nnvm install --lts\nnvm use --lts"],
      },
      {
        title: "VS Code & developer apps",
        code: [
          "winget install -e --id Microsoft.VisualStudioCode",
          "winget install -e --id Google.Chrome\nwinget install -e --id Mozilla.Firefox\nwinget install -e --id Figma.Figma\nwinget install -e --id Kap.Kap\nwinget install -e --id Warp.Dev\nwinget install -e --id Postman.Postman\nwinget install -e --id Insomnia.Insomnia",
        ],
        after: "VS Code extensions worth adding: Rust Analyzer, Python, ESLint + Prettier, GitHub Copilot, Solidity, Docker, GraphQL.",
      },
      {
        title: "Blockchain / Web3",
        code: ["npm install -g hardhat truffle ganache\ncurl -L https://foundry.paradigm.xyz | bash\nsource ~/.bashrc\nfoundryup"],
        after: "For Solidity, Aptos, Solana and IPFS, use Homebrew in WSL or each one's Windows installer.",
      },
      {
        title: "Cloud: AWS, GCP, Azure, Firebase",
        code: [
          "winget install -e --id Amazon.AWSCLI\naws configure",
          "winget install -e --id Google.CloudSDK\ngcloud init",
          "winget install -e --id Microsoft.AzureCLI\naz login",
          "npm install -g firebase-tools\nfirebase login\nfirebase init",
        ],
      },
      {
        title: "iOS (Swift) on Windows",
        note: "Xcode doesn't run on Windows: use a macOS virtual machine (UTM) or rent a Mac in the cloud, like MacinCloud or MacStadium. Or just the Swift command line:",
        code: ["winget install -e --id Swift.Swift"],
      },
      {
        title: "Make your terminal cute ✨",
        note: "Brat Academy extra, in PowerShell: a prompt that shows your Git branch.",
        code: ["winget install -e --id Starship.Starship", "Add-Content $PROFILE 'Invoke-Expression (&starship init powershell)'"],
        after: "Restart Windows Terminal, then pick a color scheme you love under Settings → Appearance.",
      },
      {
        title: "Your first commit 🎀",
        note: "Brat Academy extra, in Git Bash or WSL: start the repo every project on the path goes into.",
        code: [
          'mkdir brat-academy && cd brat-academy\ngit init\necho "# Brat Academy 💅" > README.md\ngit add README.md\ngit commit -m "First day at Brat Academy"',
          "winget install -e --id GitHub.cli\ngh auth login\ngh repo create brat-academy --public --source=. --push",
        ],
        after: "Open github.com/<your username>/brat-academy: that's your first commit, live.",
      },
      {
        title: "Clone a project",
        code: ["git clone git@github.com:yourusername/yourproject.git\ncd yourproject\nmake install-deps"],
      },
    ],
  },
];
