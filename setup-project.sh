setup_project() {
    if [ -z "$1" ]; then
        echo "Error: You must provide a repository URL"
        return 1
    fi
    
    CONFIG_DIR="config"
    REPO_URL="$1"
    
    echo "Using repository: $REPO_URL"
    echo "Config will be stored in: $CONFIG_DIR"
    
    if [ -d "$CONFIG_DIR" ]; then
        echo "Config directory already exists. Updating..."
        cd $CONFIG_DIR
        git pull
        cd ..
    else
        echo "Cloning config repository..."
        git clone $REPO_URL $CONFIG_DIR
    fi
    
    export CLAUDE_PLANS_DIR="$(pwd)/$CONFIG_DIR/claude-plans"
    
    echo "Configuration setup complete!"
    echo "Claude Code plans directory set to: $CLAUDE_PLANS_DIR"
}