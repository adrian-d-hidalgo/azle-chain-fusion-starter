FROM ghcr.io/dfinity/icp-dev-env:7

ENV NVM_DIR=/root/.nvm

# Install a more recent version of DFX
RUN dfxmv install 0.20.1

# Install Node.js specified in .nvmrc
RUN . "${NVM_DIR}/nvm.sh" && nvm install
RUN . "${NVM_DIR}/nvm.sh" && nvm use
		
# Install Azle DFX extension
RUN npx azle install-dfx-extension -y
