# Token Utils

Node.js scripts to get blockchain NFT token data and thumbnail images from an artist wallet. Currently, it supports fxhash and objkt platforms using their GraphQL APIs.

I used the script to download all the token data (thumbnail images, ipfs URL to link to a generative artwork, etc.) and self-host on [my website](https://paperdove.com/knowledge/). My work is either generative or video, so the script hasn't been tested for other types of work.

At the current state, it doesn't download the original artworks (ex. mp4 video or hi-res images) because I haven't found a need yet, but the code can be customized.

![thumbnail](./thumbs.jpg)

## How to use

1. Clone this repo: `git clone https://github.com/cdaein/token-utils.git`
1. Go into the folder: `cd token-utils`
1. Install dependencies: `npm i`
1. Install as a global package (dont' forget the `.`): `npm i -g .`
1. Now, you can run it anywhere with the command `token-utils`.
1. For example, `token-utils fxhash --help` will show you options for fxhash.
1. See below for detailed guide.

## Objkt

Add `-ca "tz1.."` for a creator wallet address and add the contract name like `-c "Versum Items"`. Objkt can fetch data from all tezos platform.

Examples:

```sh
token-utils objkt --creator-address "tz1ABCD..." --contract "Versum Items" --data --images

# I've noticed the thumbnails are missing from my hic et nunc contract so just download JSON.
token-utils objkt -ca "tz1ABCD..." -c "hic et nunc" --data
```

## fxhash

Get the ID (ex. `--id 26066`) from each project URL from the fxhash website. Optionally, pass `-s` and `-e` to set the range to download the images from. It starts at `1`. This is useful if you lose the network connection and need to continue download images. No need to provide the creator address.

Objkt API provides access to all Tezos tokens, so it can handle fxhash data as well. But for now, fxhash data comes from the fxhash API.

Examples:

```sh
# download JSON data only
token-utils fxhash --id 26066 --data

# download token data and images from 69 to 70 (inclusive)
token-utils fxhash --id 26066 --data --images -s 69 -e 70
```

## How to uninstall

1. First, see if it's installed as a global package: `npm ls -g`.
1. After checking, run `npm uninstall -g token-utils`.

## To dos

- [ ] fxhash input with `--slug`.
- [ ] ability to download the original work in case of video or images.
- [ ] make it work for collected token data of a wallet.
- [ ] get token data from Solana.

## License

MIT
