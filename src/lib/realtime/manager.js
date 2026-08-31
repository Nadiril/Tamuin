let instance = null;

class RealtimeManager {
  constructor() {
    if (instance) return instance;
    this.channels = new Map();
    this.callbacks = new Map();
    instance = this;
  }

  subscribe(supabase, table, filter, callback) {
    const key = `${table}-${JSON.stringify(filter || {})}`;

    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key).add(callback);

    if (!this.channels.has(key)) {
      if (typeof WebSocket === 'undefined') return () => {};

      const channelConfig = { event: '*', schema: 'public', table };
      if (filter) Object.assign(channelConfig, filter);

      let channel;
      try {
        channel = supabase
          .channel(key)
          .on('postgres_changes', channelConfig, (payload) => {
            const cbs = this.callbacks.get(key);
            if (cbs) cbs.forEach((cb) => cb(payload));
          })
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || status === 'SUBSCRIPTION_ERROR') {
              if (err?.message?.includes('transport failure')) return;
              console.warn(`[Realtime] ${key}: ${status}`, err?.message || err);
            }
            if (status === 'TIMED_OUT') {
              console.info(`[Realtime] ${key} timed out, retrying...`);
            }
          });
      } catch (e) {
        if (e?.message?.includes('WebSocket')) return () => {};
        throw e;
      }

      this.channels.set(key, channel);
    }

    return () => {
      const cbs = this.callbacks.get(key);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          const channel = this.channels.get(key);
          if (channel) {
            supabase.removeChannel(channel);
          }
          this.channels.delete(key);
          this.callbacks.delete(key);
        }
      }
    };
  }

  cleanup() {
    this.channels.clear();
    this.callbacks.clear();
  }
}

export const realtimeManager = new RealtimeManager();
