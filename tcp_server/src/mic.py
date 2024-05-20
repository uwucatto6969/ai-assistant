import socket
import pyaudio

# Set up a TCP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_address = ('127.0.0.1', 1342)  # Replace with your server's IP and port
sock.connect(server_address)

# Set up the audio stream
chunk = 1024  # Record in chunks of 1024 samples
sample_format = pyaudio.paInt16  # 16 bits per sample
channels = 1
fs = 44100  # Record at 44100 samples per second

p = pyaudio.PyAudio()

stream = p.open(format=sample_format,
                channels=channels,
                rate=fs,
                frames_per_buffer=chunk,
                input=True)

# Start the stream and send audio data over the TCP socket
print('Recording')
while True:
    data = stream.read(chunk)
    sock.sendall(data)

# Stop and close the stream 
stream.stop_stream()
stream.close()

# Terminate the PortAudio interface
p.terminate()

print('Finished recording')

# Close the socket
sock.close()
