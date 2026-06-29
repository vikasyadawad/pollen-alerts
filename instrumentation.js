import { registerOTel } from '@vercel/otel';
import { metrics } from '@opentelemetry/api';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export function register() {
  registerOTel({ 
    serviceName: 'pollen-alerts',
  });

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
    
    const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'pollen-alerts',
      }),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: `${otlpEndpoint}/v1/metrics`,
          }),
          exportIntervalMillis: 5000,
        })
      ],
    });
    
    metrics.setGlobalMeterProvider(meterProvider);
  }
}
