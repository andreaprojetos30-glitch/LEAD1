"use client";

import { useEffect, useState } from "react";
import type { Evento, Lead } from "@/lib/domain";
import { getActiveEventoId, getEvento, listEventos, listLeads, subscribeData } from "@/lib/repository";

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      listEventos().then((rows) => {
        if (!cancel) {
          setEventos(rows);
          setLoading(false);
        }
      });
    };
    load();
    const unsubscribe = subscribeData(load);
    return () => {
      cancel = true;
      unsubscribe();
    };
  }, []);

  return { eventos, loading };
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      listLeads().then((rows) => {
        if (!cancel) {
          setLeads(rows);
          setLoading(false);
        }
      });
    };
    load();
    const unsubscribe = subscribeData(load);
    return () => {
      cancel = true;
      unsubscribe();
    };
  }, []);

  return { leads, loading };
}

export function useActiveEvento() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      const id = getActiveEventoId();
      if (!id) {
        if (!cancel) {
          setEvento(null);
          setLoading(false);
        }
        return;
      }
      getEvento(id).then((row) => {
        if (!cancel) {
          setEvento(row ?? null);
          setLoading(false);
        }
      });
    };
    load();
    const unsubscribe = subscribeData(load);
    return () => {
      cancel = true;
      unsubscribe();
    };
  }, []);

  return { evento, loading };
}
