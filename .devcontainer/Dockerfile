FROM ghcr.io/dfinity/icp-dev-env:7

# Install a more recent version of DFX
RUN dfxvm install 0.20.1

# Install NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Install Node.js specified in .nvmrc
RUN nvm install && \
		nvm use
		
# Install Azle DFX extension
RUN npx azle install-dfx-extension
