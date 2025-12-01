import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JOPA',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const RecordsScreen(),
    );
  }
}

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  final Dio _dio = Dio();
  List<dynamic> _records = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchRecords();
  }

  Future<void> _fetchRecords() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final response = await _dio.get(
        'https://твой-сервер.ru/api/records', // ← ТВОЙ URL
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            // Если нужна авторизация:
            // 'Authorization': 'Bearer твой_токен',
          },
        ),
      );

      if (response.statusCode == 200) {
        setState(() {
          _records = response.data; // Данные с сервера
          _isLoading = false;
        });
      } else {
        throw Exception('Ошибка: ${response.statusCode}');
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.data?['message'] ?? 'Ошибка сети';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Неизвестная ошибка';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Записи с сервера'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchRecords),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Ошибка: $_error'),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _fetchRecords,
              child: const Text('Повторить'),
            ),
          ],
        ),
      );
    }

    if (_records.isEmpty) {
      return const Center(child: Text('Нет записей'));
    }

    return ListView.builder(
      itemCount: _records.length,
      itemBuilder: (context, index) {
        final record = _records[index];
        return Card(
          margin: const EdgeInsets.all(8),
          child: ListTile(
            title: Text(record['title'] ?? 'Без названия'),
            subtitle: Text(record['description'] ?? ''),
            trailing: Text('#${record['id']}'),
          ),
        );
      },
    );
  }
}
