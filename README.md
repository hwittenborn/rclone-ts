# @hwittenborn/rclone

A TypeScript client for the [rclone](https://rclone.org/) Remote Control (RC) API.

## Features

- Full support for rclone's RC API.
- Built-in rclone process management.
- Type-safe API calls using TypeScript and Zod.

## Installation

```bash
npm install @hwittenborn/rclone
```

## Example Usage

```typescript
import { Rclone } from '@hwittenborn/rclone';

const rclone = new Rclone();

async function main() {
    // Initialize rclone process (spawns rclone rc)
    await rclone.init();

    // List remotes
    const remotes = await rclone.config.listRemotes();
    console.log(remotes);

    // Stop rclone process
    rclone.stop();
}

main();
```
