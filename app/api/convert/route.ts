import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get the backend API URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    
    // Forward the request to the NestJS backend
    const response = await axios.post(
      `${backendUrl}/api/tools/heic-to-jpg`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add your API key here
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        responseType: 'stream',
      }
    );

    // Get the content type and filename from headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const contentDisposition = response.headers['content-disposition'] || 'attachment; filename="converted.jpg"';

    // Convert the stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    
    let status = 500;
    let message = 'Internal server error';
    
    if (axios.isAxiosError(error)) {
      status = error.response?.status || 500;
      message = error.response?.data?.message || error.message;
    }
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// Set max duration for longer conversions
export const maxDuration = 30;