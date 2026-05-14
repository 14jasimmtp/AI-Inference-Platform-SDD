import socket
import threading
import sys

def handle_client(client_socket):
    target_host = "127.0.0.1"
    target_port = 11434
    
    try:
        target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        target_socket.connect((target_host, target_port))
        
        def forward(src, dst):
            try:
                while True:
                    data = src.recv(4096)
                    if len(data) == 0:
                        break
                    dst.sendall(data)
            except Exception:
                pass
            finally:
                src.close()
                dst.close()

        threading.Thread(target=forward, args=(client_socket, target_socket)).start()
        threading.Thread(target=forward, args=(target_socket, client_socket)).start()
    except Exception as e:
        print(f"Failed to connect to target: {e}")
        client_socket.close()

def main():
    listen_host = "0.0.0.0"
    listen_port = 11435

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((listen_host, listen_port))
    server.listen(5)
    
    print(f"[*] Listening on {listen_host}:{listen_port} and forwarding to 127.0.0.1:11434")
    
    while True:
        client_socket, addr = server.accept()
        threading.Thread(target=handle_client, args=(client_socket,)).start()

if __name__ == "__main__":
    main()
