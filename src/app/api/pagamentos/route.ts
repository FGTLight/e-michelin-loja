import { NextResponse, type NextRequest } from 'next/server';
import { apiError, clientIp, rateLimit } from '@/lib/api';
import { startPayment } from '@/lib/payments';
import { paymentSchema } from '@/lib/validators';

/** Gera a cobrança (Pix, boleto ou cartão tokenizado no navegador) para um pedido aguardando pagamento. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`pay:${clientIp(req)}`, 10)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
  try {
    const input = paymentSchema.parse(await req.json());
    const payment = await startPayment(input);
    return NextResponse.json({
      method: payment.method,
      status: payment.status,
      status_detail: payment.status_detail,
      pix_qr_code: payment.pix_qr_code,
      pix_qr_code_base64: payment.pix_qr_code_base64,
      boleto_url: payment.boleto_url,
      boleto_barcode: payment.boleto_barcode,
      expires_at: payment.expires_at,
    });
  } catch (e) {
    return apiError(e);
  }
}
