import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter multer limits', () => {
  it('maps LIMIT_FILE_SIZE to 413', () => {
    const filter = new AllExceptionsFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ id: 'req-1', method: 'POST', url: '/upload' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new MulterError('LIMIT_FILE_SIZE'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'File exceeds 10MB limit',
        }),
      }),
    );
  });
});
