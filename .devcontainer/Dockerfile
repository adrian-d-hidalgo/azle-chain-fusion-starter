FROM centos:7

ENV NVM_VERSION=v0.39.7
ENV DFX_VERSION=0.20.1

# Install a more recent version of DFX
RUN DFX_VERSION=$DFX_VERSION DFXVM_INIT_YES=true sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Install NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v$NVM_VERSION/install.sh | bash

# Source NVM
RUN source ~/.bashrc

# Install Node.js specified in .nvmrc
RUN nvm install && \
		nvm use
		
# Install Azle DFX extension
RUN npx azle install-dfx-extension -y
