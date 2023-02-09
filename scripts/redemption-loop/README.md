# Redemption Loop

This script allows to commit to an offer and redeem the exchange, passing a delivery info message through the chat layer

## How to build

Be sure you've build the chat-sdk package 
```
# in the repo root folder
npm run build
```

## How to run

In the `./scripts/redemption-loop` directory
```
# in the `./scripts/redemption-loop` directory
npm run start
```

By default the CoreSDK environment is "testing"

### Arguments:

- --offerId (required): the offerId to commit to
- --buyerPrivateKey (required): private key of the buyer wallet
- --nbCommits: Nb of times to commit (default: 30)
- --env "testing" (default) | "staging" | "production"
- --xmtpEnv "dev" | "production". Default value depends on the coreSDK env

For instance:
```
npm run start -- --offerId 12 --buyerPrivateKey 0x0132456789...0123456789 --env production --xmtpEnv dev --nbCommits 99
```

