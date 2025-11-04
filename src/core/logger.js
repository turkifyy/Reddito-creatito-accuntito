class SystemLogger {
    production(message) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] 🏭 ${message}`);
    }

    success(message) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ✅ ${message}`);
    }

    warning(message) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ⚠️ ${message}`);
    }

    error(message) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ❌ ${message}`);
    }

    info(message) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ℹ️ ${message}`);
    }
}

module.exports = { SystemLogger };
