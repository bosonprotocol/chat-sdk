# Check Sellers

This script allow to check all sellers and their current XMTP status (whether the chat has been initialized or not)

## How to build

Be sure you've build the chat-sdk package 
```
# in the repo root folder
npm run build
```

## How to run

In the `./scripts/check-sellers` directory
```
# in the `./scripts/check-sellers` directory
npm run start
```

By default the CoreSDK environment is "testing"

### Arguments:

- --env "testing" (default) | "staging" | "production"
- --xmtpEnv "dev" | "production". Default value depends on the coreSDK env
- --buyers: check also buyers (default: check only sellers)

For instance:
```
npm run start -- --env production --xmtpEnv dev --buyers
```

