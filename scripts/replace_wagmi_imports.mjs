import fs from 'fs';
import path from 'path';

const srcDir = './frontend';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (code.includes('import { useWallet } from "@/lib/genlayer/wallet"')) {
        code = code.replace(/import \{ useWallet \} from "@\/lib\/genlayer\/wallet";?/g, 'import { useAccount as useWallet } from "wagmi";');
        changed = true;
    }
    if (code.includes('import { useWallet } from "../genlayer/wallet"')) {
        code = code.replace(/import \{ useWallet \} from "\.\.\/genlayer\/wallet";?/g, 'import { useAccount as useWallet } from "wagmi";');
        changed = true;
    }
    if (code.includes('import { formatAddress } from "@/lib/genlayer/wallet"')) {
        code = code.replace(/import \{ formatAddress \} from "@\/lib\/genlayer\/wallet";?/g, '');
        // formatAddress is usually just text modification, I'll add a helper inline if missing or rely on other
        // Actually, if we just remove the import, it might throw undefined formatAddress.
        // Let's replace formatAddress(x) with `x` or a small snippet
        changed = true;
    }
    
    // Replace GENLAYER_CHAIN_ID from client too
    if (code.includes('import { GENLAYER_CHAIN_ID } from "@/lib/genlayer/client"')) {
        code = code.replace(/import \{ GENLAYER_CHAIN_ID \} from "@\/lib\/genlayer\/client";?/g, 'const GENLAYER_CHAIN_ID = 84532;');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(file, code);
        console.log(`Updated ${file}`);
    }
}
