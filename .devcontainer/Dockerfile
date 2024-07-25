FROM ghcr.io/dfinity/icp-dev-env:7

# Install a more recent version of DFX
RUN dfxvm install 0.20.1

# Source bashrc to make sure nvm is available
# RUN . ~/.bashrc

# Install Node.js specified in .nvmrc
RUN nvm install
RUN nvm use
		
# Install Azle DFX extension
RUN npx azle install-dfx-extension -y
